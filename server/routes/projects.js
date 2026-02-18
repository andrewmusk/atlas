import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/projects — list all project nodes
router.get('/projects', async (req, res, next) => {
  try {
    const projects = await prisma.node.findMany({
      where: { type: 'project' },
      orderBy: { createdAt: 'asc' },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/summary — node counts by status and type
router.get('/projects/:id/summary', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.node.findUnique({ where: { id }, select: { id: true, type: true } });
    if (!project || project.type !== 'project') {
      return res.status(404).json({ error: `Project not found: ${id}`, code: 'NOT_FOUND' });
    }

    // Get all nodes in this project's tree
    // We do a raw aggregation using groupBy
    const allNodes = await prisma.node.findMany({
      select: { type: true, status: true },
    });

    // Build summary: total, by status, by type
    const total = allNodes.length;

    const byStatus = {};
    const byType = {};

    for (const node of allNodes) {
      byStatus[node.status] = (byStatus[node.status] || 0) + 1;
      byType[node.type] = (byType[node.type] || 0) + 1;
    }

    res.json({ projectId: id, total, byStatus, byType });
  } catch (err) {
    next(err);
  }
});

export default router;
