import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db.js';
import { buildSystemPrompt, buildMessagesArray } from '../lib/chatContext.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/nodes/:id/chat — get thread + context payload
router.get('/:id/chat', async (req, res, next) => {
  try {
    const { id } = req.params;

    const node = await prisma.node.findUnique({ where: { id } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { nodeId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      node: {
        id: node.id,
        type: node.type,
        status: node.status,
        parentId: node.parentId,
        payload: node.payload,
      },
      messages,
      context: {
        systemPrompt: buildSystemPrompt(node),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/nodes/:id/chat — post a human or agent message
router.post('/:id/chat', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, author = 'anonymous', authorType = 'human', authorLabel, sessionId } = req.body;
    requireFields(req.body, ['content']);

    const node = await prisma.node.findUnique({ where: { id }, select: { id: true } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        nodeId: id,
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

// POST /api/nodes/:id/chat/ai — stream AI response
router.post('/:id/chat/ai', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, author = 'anonymous', authorType = 'human', authorLabel, sessionId } = req.body;
    requireFields(req.body, ['content']);

    const node = await prisma.node.findUnique({ where: { id } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    // Persist the human message first
    await prisma.chatMessage.create({
      data: {
        nodeId: id,
        role: 'user',
        authorLabel: authorLabel || author,
        authorType,
        content,
        sessionId: sessionId || null,
      },
    });

    // Load full message history for context
    const allMessages = await prisma.chatMessage.findMany({
      where: { nodeId: id },
      orderBy: { createdAt: 'asc' },
    });

    const systemPrompt = buildSystemPrompt(node);
    const messagesArray = buildMessagesArray(allMessages);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    let fullContent = '';

    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messagesArray,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          const token = chunk.delta.text;
          fullContent += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }

      // Persist the full AI response
      await prisma.chatMessage.create({
        data: {
          nodeId: id,
          role: 'assistant',
          authorLabel: 'Claude',
          authorType: 'agent',
          content: fullContent,
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
