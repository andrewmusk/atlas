import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db.js';
import { buildSystemPrompt, buildMessagesArray, PROPOSE_EDIT_TOOL } from '../lib/chatContext.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/chats/:chatId — get chat with messages and node context
router.get('/:chatId', async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        node: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: `Chat not found: ${chatId}`, code: 'NOT_FOUND' });
    }

    res.json({
      id: chat.id,
      nodeId: chat.nodeId,
      title: chat.title,
      createdAt: chat.createdAt,
      node: {
        id: chat.node.id,
        type: chat.node.type,
        status: chat.node.status,
        parentId: chat.node.parentId,
        payload: chat.node.payload,
      },
      messages: chat.messages,
      context: {
        systemPrompt: buildSystemPrompt(chat.node),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/chats/:chatId/messages — post a human or agent message
router.post('/:chatId/messages', async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, author = 'anonymous', authorType = 'human', authorLabel, sessionId } = req.body;
    requireFields(req.body, ['content']);

    const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { id: true } });
    if (!chat) {
      return res.status(404).json({ error: `Chat not found: ${chatId}`, code: 'NOT_FOUND' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        role: 'user',
        authorLabel: authorLabel || author,
        authorType,
        content,
        sessionId: sessionId || null,
      },
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

// POST /api/chats/:chatId/ai — stream AI response with propose_edit tool support
router.post('/:chatId/ai', async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, author = 'anonymous', authorType = 'human', authorLabel, sessionId } = req.body;
    requireFields(req.body, ['content']);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        node: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: `Chat not found: ${chatId}`, code: 'NOT_FOUND' });
    }

    // Persist the human message first
    await prisma.chatMessage.create({
      data: {
        chatId,
        role: 'user',
        authorLabel: authorLabel || author,
        authorType,
        content,
        sessionId: sessionId || null,
      },
    });

    // Build message history including the new human message
    const allMessages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    const systemPrompt = buildSystemPrompt(chat.node);
    const messagesArray = buildMessagesArray(allMessages);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    let fullText = '';
    const proposals = [];
    let currentBlock = null;
    let currentToolInput = '';

    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messagesArray,
        tools: [PROPOSE_EDIT_TOOL],
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_start') {
          currentBlock = chunk.content_block;
          currentToolInput = '';
        } else if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            const token = chunk.delta.text;
            fullText += token;
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          } else if (chunk.delta.type === 'input_json_delta') {
            currentToolInput += chunk.delta.partial_json;
          }
        } else if (chunk.type === 'content_block_stop') {
          if (currentBlock?.type === 'tool_use' && currentBlock.name === 'propose_edit') {
            try {
              const proposal = JSON.parse(currentToolInput);
              proposals.push(proposal);
              res.write(`data: ${JSON.stringify({ type: 'proposal', proposal })}\n\n`);
            } catch (e) {
              console.error('Failed to parse tool input:', currentToolInput, e);
            }
          }
          currentBlock = null;
        }
      }

      // Persist AI message — as JSON if there are proposals, plain text otherwise
      const aiContent =
        proposals.length > 0
          ? JSON.stringify({ text: fullText, proposals })
          : fullText;

      await prisma.chatMessage.create({
        data: {
          chatId,
          role: 'assistant',
          authorLabel: 'Claude',
          authorType: 'agent',
          content: aiContent,
        },
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (aiErr) {
      console.error('Anthropic stream error:', aiErr);
      res.write(`data: ${JSON.stringify({ error: aiErr.message })}\n\n`);
      res.end();
    }
  } catch (err) {
    next(err);
  }
});

export default router;
