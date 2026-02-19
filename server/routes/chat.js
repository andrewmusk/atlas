import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/nodes/:id/chats — list all chats for a node
router.get('/:id/chats', async (req, res, next) => {
  try {
    const { id } = req.params;

    const node = await prisma.node.findUnique({ where: { id }, select: { id: true } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    const chats = await prisma.chat.findMany({
      where: { nodeId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    const result = chats.map((c) => ({
      id: c.id,
      nodeId: c.nodeId,
      title: c.title,
      createdAt: c.createdAt,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]
        ? { role: c.messages[0].role, content: c.messages[0].content.substring(0, 120), createdAt: c.messages[0].createdAt }
        : null,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/nodes/:id/chats — create a new chat for a node
router.post('/:id/chats', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const node = await prisma.node.findUnique({ where: { id }, select: { id: true } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    const chat = await prisma.chat.create({
      data: { nodeId: id, title: title || null },
    });

    res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
});

export default router;
