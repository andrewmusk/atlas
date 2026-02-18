import { Router } from 'express';
import prisma from '../db.js';
import { generateNodeId } from '../lib/idGenerator.js';
import { validateParentChild, deriveSubsystemAbbrev } from '../lib/hierarchyRules.js';
import { writeCreated, writePayloadEdit } from '../lib/changelogWriter.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

// POST /api/nodes — create a node
router.post('/', async (req, res, next) => {
  try {
    const { type, parentId, payload = {}, author = 'anonymous', authorType = 'human' } = req.body;
    requireFields(req.body, ['type']);

    const VALID_TYPES = ['project', 'system', 'subsystem', 'capability', 'requirement', 'flow'];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid node type: ${type}`, code: 'VALIDATION_ERROR' });
    }

    // Fetch parent and validate hierarchy
    let parentNode = null;
    if (parentId) {
      parentNode = await prisma.node.findUnique({ where: { id: parentId } });
      if (!parentNode) {
        return res.status(404).json({ error: `Parent node not found: ${parentId}`, code: 'NOT_FOUND' });
      }
    }

    try {
      validateParentChild(type, parentNode);
    } catch (e) {
      return res.status(400).json({ error: e.message, code: 'HIERARCHY_ERROR' });
    }

    // Subsystem nodes require abbreviation in payload
    if (type === 'subsystem' && !payload.abbreviation) {
      return res.status(400).json({
        error: 'Subsystem nodes require payload.abbreviation (e.g. "HIER")',
        code: 'VALIDATION_ERROR',
      });
    }

    // Derive subsystem abbreviation for ID generation
    let subsystemAbbrev;
    if (type === 'project') {
      subsystemAbbrev = payload.abbreviation || 'PROJ';
    } else if (type === 'system') {
      subsystemAbbrev = payload.abbreviation || 'SYS';
    } else if (type === 'subsystem') {
      subsystemAbbrev = payload.abbreviation;
    } else {
      // capability, requirement, flow: walk up to find subsystem
      try {
        subsystemAbbrev = await deriveSubsystemAbbrev(prisma, parentNode);
      } catch (e) {
        return res.status(400).json({ error: e.message, code: 'HIERARCHY_ERROR' });
      }
    }

    const id = await generateNodeId(prisma, subsystemAbbrev, type);

    const node = await prisma.node.create({
      data: {
        id,
        type,
        status: 'not_started',
        parentId: parentId || null,
        payload,
      },
    });

    await writeCreated(prisma, { nodeId: id, author, authorType });

    // For requirements, write initial payload version
    if (type === 'requirement') {
      const { writePayloadVersion } = await import('../lib/changelogWriter.js');
      await writePayloadVersion(prisma, { nodeId: id, payload, author, authorType });
    }

    res.status(201).json(node);
  } catch (err) {
    next(err);
  }
});

// GET /api/nodes/:id — read a node
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        outgoingDeps: { include: { target: { select: { id: true, type: true, status: true } } } },
        incomingDeps: { include: { source: { select: { id: true, type: true, status: true } } } },
        changelogEntries: { orderBy: { timestamp: 'asc' } },
        payloadVersions: { orderBy: { version: 'asc' } },
      },
    });

    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    res.json(node);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/nodes/:id — update payload (partial merge)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payload: payloadPatch, author = 'anonymous', authorType = 'human' } = req.body;

    const node = await prisma.node.findUnique({ where: { id } });
    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    const mergedPayload = { ...(node.payload || {}), ...(payloadPatch || {}) };

    const updated = await prisma.node.update({
      where: { id },
      data: { payload: mergedPayload },
    });

    await writePayloadEdit(prisma, { node, newPayload: mergedPayload, author, authorType });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/nodes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        incomingDeps: { select: { sourceId: true } },
      },
    });

    if (!node) {
      return res.status(404).json({ error: `Node not found: ${id}`, code: 'NOT_FOUND' });
    }

    if (node.children.length > 0) {
      return res.status(400).json({
        error: `Cannot delete node ${id}: it has ${node.children.length} child node(s). Delete children first.`,
        code: 'HAS_CHILDREN',
      });
    }

    if (node.incomingDeps.length > 0) {
      const dependents = node.incomingDeps.map((d) => d.sourceId).join(', ');
      return res.status(400).json({
        error: `Cannot delete node ${id}: it is depended on by: ${dependents}`,
        code: 'HAS_DEPENDENTS',
      });
    }

    // Delete related records first, then the node
    await prisma.$transaction([
      prisma.changelogEntry.deleteMany({ where: { nodeId: id } }),
      prisma.payloadVersion.deleteMany({ where: { nodeId: id } }),
      prisma.chatMessage.deleteMany({ where: { nodeId: id } }),
      prisma.nodeDependency.deleteMany({ where: { OR: [{ sourceId: id }, { targetId: id }] } }),
      prisma.node.delete({ where: { id } }),
    ]);

    res.json({ deleted: id });
  } catch (err) {
    next(err);
  }
});

export default router;
