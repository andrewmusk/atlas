import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateId(prefix) {
  const result = await prisma.$transaction(async (tx) => {
    return tx.idCounter.upsert({
      where: { prefix },
      update: { count: { increment: 1 } },
      create: { prefix, count: 1 },
    });
  });
  return `${result.prefix}-${String(result.count).padStart(3, '0')}`;
}

async function createNode({ id, type, status = 'not_started', parentId, payload }) {
  const node = await prisma.node.create({
    data: { id, type, status, parentId: parentId ?? null, payload },
  });
  await prisma.changelogEntry.create({
    data: {
      nodeId: id,
      changeType: 'created',
      summary: `Created by seed`,
      author: 'system',
      authorType: 'agent',
    },
  });
  if (type === 'requirement') {
    await prisma.payloadVersion.create({
      data: { nodeId: id, version: 1, payload, author: 'system', authorType: 'agent' },
    });
  }
  return node;
}

async function makeSubsystem({ prefix, parentId, name, purpose }) {
  const id = await generateId(`${prefix}-SUB`);
  await createNode({
    id,
    type: 'subsystem',
    status: 'not_started',
    parentId,
    payload: { name, purpose, abbreviation: prefix },
  });
  console.log(`  ${id}  ${name}`);
  return id;
}

async function makeReq({ prefix, parentId, data }) {
  const id = await generateId(`${prefix}-REQ`);
  await createNode({ id, type: 'requirement', parentId, payload: data });
  const stmt = data.statement?.substring(0, 70) || id;
  console.log(`    ${id}  ${stmt}…`);
  return id;
}

async function seed() {
  console.log('Wiping existing data…');
  await prisma.$transaction([
    prisma.chatMessage.deleteMany(),
    prisma.changelogEntry.deleteMany(),
    prisma.payloadVersion.deleteMany(),
    prisma.nodeDependency.deleteMany(),
    prisma.node.deleteMany(),
    prisma.idCounter.deleteMany(),
  ]);

  console.log('Seeding Atlas…\n');

  // ── Project + System ──────────────────────────────────────────
  const projId = await generateId('ATLAS-PROJ');
  await createNode({
    id: projId,
    type: 'project',
    status: 'building',
    payload: {
      name: 'Atlas',
      mission: 'Give agents and humans a shared, queryable state of what a company is building.',
      constraints: [
        'API must be queryable from external apps',
        'Chat history per node must be exportable as structured JSON',
        'Node schema must be stable enough to version',
        'Snapshot exports must be re-importable to seed a new project',
      ],
    },
  });
  console.log(`${projId}  Atlas (project)`);

  const sysId = await generateId('ATLAS-SYS');
  await createNode({
    id: sysId,
    type: 'system',
    status: 'building',
    parentId: projId,
    payload: { name: 'Atlas', description: 'The full Atlas system — a company state machine.' },
  });
  console.log(`${sysId}  Atlas (system)\n`);

  // ── HIER ──────────────────────────────────────────────────────
  const hierSub = await makeSubsystem({
    prefix: 'HIER',
    parentId: sysId,
    name: 'Project & Hierarchy Management',
    purpose: 'Owns the node graph — creating, reading, updating, and organizing all nodes and their relationships.',
  });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Create nodes of any type (project, system, subsystem, requirement, flow) with field validation.', acceptance_criteria: ['Required fields are validated before saving', 'Clear error on missing fields'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Fetch a node by ID with its full payload, status, parent, and dependencies.', acceptance_criteria: ['Returns everything about the node', '404 if it does not exist'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Update a node payload with partial merge — only the fields you send get changed.', acceptance_criteria: ['Untouched fields stay the same', 'Triggers a changelog entry'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Enforce the parent-child hierarchy: project > system > subsystem > requirement.', acceptance_criteria: ['Cannot create a requirement without a subsystem parent', 'Clear error explaining what went wrong'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Declare dependency edges between requirements so we know what blocks what.', acceptance_criteria: ['A requirement can depend on other requirements', 'Dependencies show up when you fetch the node', 'Warning if you try to delete something other nodes depend on'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Detect and reject circular dependencies before saving.', acceptance_criteria: ['Cycle check runs before the edge is saved', 'Error message identifies the cycle'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'Auto-generate human-readable IDs based on subsystem and type (e.g. HIER-REQ-001).', acceptance_criteria: ['IDs are unique and immutable', 'Counter increments per subsystem per type'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'List all children of a node, optionally filtered by type.', acceptance_criteria: ['Returns matching children', 'Empty array if none exist'] } });

  // ── CLOG ──────────────────────────────────────────────────────
  const clogSub = await makeSubsystem({
    prefix: 'CLOG',
    parentId: sysId,
    name: 'Status & Changelog',
    purpose: 'Tracks the lifecycle of every node — status transitions, payload edits, and version history.',
  });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'Every node has a status: draft, not_started, building, built, or deprecated.', acceptance_criteria: ['New nodes default to not_started (or draft when AI-proposed)', 'Invalid values are rejected'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'Only valid status transitions are allowed (e.g. draft > not_started > building > built, any > deprecated).', acceptance_criteria: ['Invalid transitions return an error', 'Built > building is allowed for rework'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'Log every status change with who did it and when.', acceptance_criteria: ['Each entry has previous/new status, timestamp, author', 'Append-only — cannot edit or delete log entries'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'Version requirement payloads on every edit so you can see what changed over time.', acceptance_criteria: ['Each edit creates a new version with full payload snapshot', 'Previous versions are retrievable'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'Show a project-level summary of how many nodes are in each status.', acceptance_criteria: ['Breakdown by status and type', 'Computable on demand'] } });

  // ── CHAT ──────────────────────────────────────────────────────
  const chatSub = await makeSubsystem({
    prefix: 'CHAT',
    parentId: sysId,
    name: 'Chat System',
    purpose: 'Node-scoped conversations between humans and AI. Chat history is a first-class artifact tied to each node.',
  });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'Each node has its own chat thread, created automatically when the first message is sent.', acceptance_criteria: ['One thread per node', 'Empty thread returns an empty list, not an error'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'Messages record who sent them, when, and whether they are human or AI.', acceptance_criteria: ['Messages are append-only', 'Timestamps are UTC'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'Export a node chat thread as structured JSON so agents can consume it as context.', acceptance_criteria: ['Export includes node metadata, payload, and full message history'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'AI responses stream token-by-token so you see them as they are generated.', acceptance_criteria: ['SSE stream with individual tokens', 'Full message persisted after stream completes'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'When AI proposes a change to a node during chat, an Accept button lets you commit it as a new version.', acceptance_criteria: ['Accept creates a new payload version with changelog entry', 'Works on any node, not just during the build flow', 'Rejected proposals stay in chat but do not alter the node'] } });

  // ── SNAP ──────────────────────────────────────────────────────
  const snapSub = await makeSubsystem({
    prefix: 'SNAP',
    parentId: sysId,
    name: 'Snapshot & Diff Engine',
    purpose: 'Point-in-time snapshots of the full project and diffs between any two snapshots.',
  });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'Take a snapshot of the entire project graph on demand — every node, payload, and status.', acceptance_criteria: ['Timestamped and optionally named', 'Immutable once created'] } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'List all snapshots for a project, newest first.', acceptance_criteria: ['Shows name, timestamp, and node count'] } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'Diff any two snapshots to see what changed — nodes added, removed, status changes, payload edits.', acceptance_criteria: ['Field-level diffs for payload changes', 'Structured JSON output'] } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'Export a snapshot as a standalone JSON file that can be re-imported to seed a new project.', acceptance_criteria: ['Includes full graph, changelogs, versions', 'Re-imported projects are independent copies'] } });

  // ── API ───────────────────────────────────────────────────────
  const apiSub = await makeSubsystem({
    prefix: 'API',
    parentId: sysId,
    name: 'API Layer',
    purpose: 'HTTP interface exposing Atlas to external apps and agents.',
  });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'Read any node by ID with full payload, status, parent, and dependencies.', acceptance_criteria: ['GET /nodes/:id', '404 for missing nodes'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'List children of a node with optional type filter.', acceptance_criteria: ['GET /nodes/:id/children?type=...', 'Empty array when none exist'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'Update a node status with transition enforcement.', acceptance_criteria: ['PATCH /nodes/:id/status', 'Invalid transitions return 400'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'Create and update nodes with hierarchy validation.', acceptance_criteria: ['POST /nodes creates', 'PATCH /nodes/:id updates payload', 'Both enforce parent-child rules'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'Retrieve a node chat thread as a context payload.', acceptance_criteria: ['GET /nodes/:id/chat returns node metadata + messages', 'Empty history if no messages'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'Post a message to a node chat thread.', acceptance_criteria: ['POST /nodes/:id/chat', 'Returns the created message with timestamp'] } });

  // ── UI ────────────────────────────────────────────────────────
  const uiSub = await makeSubsystem({
    prefix: 'UI',
    parentId: sysId,
    name: 'Builder Interface',
    purpose: 'The web app — tree navigation, node editing, chat, and the guided build flow for creating projects.',
  });

  // Core UI
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Show the node hierarchy as a collapsible tree that lazy-loads children when you expand a node.', acceptance_criteria: ['Clicking a node selects it for editing', 'Status shown as colored badges', 'Draft nodes are visually distinct'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Provide type-specific editors (project, system, subsystem, requirement) that auto-save on blur.', acceptance_criteria: ['Each type shows relevant fields', 'Changes persist automatically'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Status dropdown only allows valid transitions — invalid options are disabled.', acceptance_criteria: ['Changelog updates after a status change'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Chat panel on every node with human messages and streaming AI responses.', acceptance_criteria: ['Messages appear immediately', 'AI streams token-by-token'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Resizable panels — drag the dividers between tree, editor, and chat to control their width.', acceptance_criteria: ['Panels have min/max constraints so nothing collapses completely'] } });

  // Build flow
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'A "Create Project" button that launches the guided build flow.', acceptance_criteria: ['Enters a wizard-style guided experience', 'Creates a new project node in draft status'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Deep questioning phase — AI asks about what you are building, why, for whom, and what success looks like before proposing any structure.', acceptance_criteria: ['Conversation saved to the project node chat', 'AI signals when it is ready to propose subsystems', 'User can keep going or trigger proposals early'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'AI proposes subsystems from the discovery conversation, shown as a batch for review.', acceptance_criteria: ['Each subsystem shows name, purpose, abbreviation', 'User can accept, deny, edit, or add new ones', 'Accepted subsystems become real nodes in the tree'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Per-subsystem deep dive — AI asks targeted questions then proposes requirements, each saved to the subsystem chat thread.', acceptance_criteria: ['User steps into each subsystem for focused discussion', 'Chat is forked to the subsystem node'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Requirement review — accept, dive in to edit via chat, or skip to come back later.', acceptance_criteria: ['Accepted requirements become nodes under the subsystem', 'Diving in opens a chat thread on that requirement', 'Skipped items stay as drafts'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Draft nodes for anything AI proposes but the user has not yet reviewed.', acceptance_criteria: ['Drafts are visually distinct in the tree', 'Accepting promotes to not_started', 'Denying removes the node'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'Build progress overview — shows the full hierarchy with what is done vs skipped, letting you jump into any incomplete item.', acceptance_criteria: ['Visible when re-entering the build flow', 'Skipped and draft items are clearly marked'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'AI asks follow-up questions when the user significantly changes or adds to what was proposed.', acceptance_criteria: ['Edits or additions trigger clarifying questions', 'Feels conversational, not interrogative'] } });

  console.log('\nSeed complete.');
}

seed()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
