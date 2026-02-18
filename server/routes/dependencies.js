import { Router } from 'express';
import prisma from '../db.js';
import { detectCycle } from '../lib/dependencyGraph.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

// POST /api/nodes/:id/dependencies — add dependency edge
router.post('/:id/dependencies', async (req, res, next) => {
  try {
    const { id: sourceId } = req.params;
    const { targetId } = req.body;
    requireFields(req.body, ['targetId']);

    if (sourceId === targetId) {
      return res.status(400).json({ error: 'A node cannot depend on itself', code: 'SELF_DEPENDENCY' });
    }

    // Verify both nodes exist
    const [source, target] = await Promise.all([
      prisma.node.findUnique({ where: { id: sourceId }, select: { id: true } }),
      prisma.node.findUnique({ where: { id: targetId }, select: { id: true } }),
    ]);

    if (!source) return res.status(404).json({ error: `Source node not found: ${sourceId}`, code: 'NOT_FOUND' });
    if (!target) return res.status(404).json({ error: `Target node not found: ${targetId}`, code: 'NOT_FOUND' });

    // Check for cycle
    const hasCycle = await detectCycle(prisma, sourceId, targetId);
    if (hasCycle) {
      return res.status(400).json({
        error: `Adding dependency ${sourceId} → ${targetId} would create a circular dependency`,
        code: 'CIRCULAR_DEPENDENCY',
      });
    }

    const dep = await prisma.nodeDependency.create({
      data: { sourceId, targetId },
    });

    res.status(201).json(dep);
  } catch (err) {
    // Handle unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Dependency already exists', code: 'DUPLICATE' });
    }
    next(err);
  }
});

// DELETE /api/nodes/:id/dependencies/:tid — remove dependency edge
router.delete('/:id/dependencies/:tid', async (req, res, next) => {
  try {
    const { id: sourceId, tid: targetId } = req.params;

    const dep = await prisma.nodeDependency.findUnique({
      where: { sourceId_targetId: { sourceId, targetId } },
    });

    if (!dep) {
      return res.status(404).json({ error: 'Dependency not found', code: 'NOT_FOUND' });
    }

    await prisma.nodeDependency.delete({
      where: { sourceId_targetId: { sourceId, targetId } },
    });

    res.json({ deleted: true, sourceId, targetId });
  } catch (err) {
    next(err);
  }
});

export default router;
