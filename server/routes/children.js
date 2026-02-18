import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/nodes/:id/children?type=
router.get('/:id/children', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const parent = await prisma.node.findUnique({ where: { id }, select: { id: true } });
    if (!parent) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    const where = { parentId: id };
    if (type) where.type = type;

    const children = await prisma.node.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    res.json(children);
  } catch (err) {
    next(err);
  }
});

export default router;
