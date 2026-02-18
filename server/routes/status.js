import { Router } from 'express';
import prisma from '../db.js';
import { validateTransition } from '../lib/statusMachine.js';
import { writeStatusTransition } from '../lib/changelogWriter.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

// PATCH /api/nodes/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus, author = 'anonymous', authorType = 'human' } = req.body;
    requireFields(req.body, ['status']);

    const node = await prisma.node.findUnique({ where: { id } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    try {
      validateTransition(node.status, newStatus);
    } catch (e) {
      return res.status(400).json({ error: e.message, code: 'INVALID_TRANSITION' });
    }

    const previousStatus = node.status;

    const updated = await prisma.node.update({
      where: { id },
      data: { status: newStatus },
    });

    await writeStatusTransition(prisma, {
      nodeId: id,
      previousStatus,
      newStatus,
      author,
      authorType,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
