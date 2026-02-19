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
  const stmt = data.name || data.statement?.substring(0, 70) || id;
  console.log(`    ${id}  ${stmt}`);
  return id;
}

async function seed() {
  console.log('Wiping existing data…');
  await prisma.$transaction([
    prisma.chatMessage.deleteMany(),
    prisma.chat.deleteMany(),
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
      problem: 'Teams and agents have no shared, structured view of what is being built. Context lives in scattered docs, chat threads, and people\'s heads.',
      opportunity: 'A single queryable state machine that both humans and AI agents can read and write — the source of truth for what a company is building.',
      why_now: 'AI agents are becoming real collaborators, but they need structured context to be useful. Without it, every session starts from scratch.',
      what_were_building: 'A web app where you define your project as a hierarchy of systems, subsystems, and requirements — then refine them through conversation with AI.',
      roadmap: 'Phase 1: Core hierarchy + chat. Phase 2: Guided build flow. Phase 3: Snapshots and diffing.',
      revenue: '',
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
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Create any node type', statement: 'Create nodes of any type (project, system, subsystem, requirement, flow) with field validation.', acceptance_criteria: ['Required fields are validated before saving', 'Clear error on missing fields'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Fetch node by ID', statement: 'Fetch a node by ID with its full payload, status, parent, and dependencies.', acceptance_criteria: ['Returns everything about the node', '404 if it does not exist'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Partial payload update', statement: 'Update a node payload with partial merge — only the fields you send get changed.', acceptance_criteria: ['Untouched fields stay the same', 'Triggers a changelog entry'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Enforce node hierarchy', statement: 'Enforce the parent-child hierarchy: project > system > subsystem > requirement.', acceptance_criteria: ['Cannot create a requirement without a subsystem parent', 'Clear error explaining what went wrong'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Declare dependency edges', statement: 'Declare dependency edges between requirements so we know what blocks what.', acceptance_criteria: ['A requirement can depend on other requirements', 'Dependencies show up when you fetch the node', 'Warning if you try to delete something other nodes depend on'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Detect circular dependencies', statement: 'Detect and reject circular dependencies before saving.', acceptance_criteria: ['Cycle check runs before the edge is saved', 'Error message identifies the cycle'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'Auto-generate readable IDs', statement: 'Auto-generate human-readable IDs based on subsystem and type (e.g. HIER-REQ-001).', acceptance_criteria: ['IDs are unique and immutable', 'Counter increments per subsystem per type'] } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { name: 'List node children', statement: 'List all children of a node, optionally filtered by type.', acceptance_criteria: ['Returns matching children', 'Empty array if none exist'] } });

  // ── CLOG ──────────────────────────────────────────────────────
  const clogSub = await makeSubsystem({
    prefix: 'CLOG',
    parentId: sysId,
    name: 'Status & Changelog',
    purpose: 'Tracks the lifecycle of every node — status transitions, payload edits, and version history.',
  });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { name: 'Node status values', statement: 'Every node has a status: draft, not_started, building, built, or deprecated.', acceptance_criteria: ['New nodes default to not_started (or draft when AI-proposed)', 'Invalid values are rejected'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { name: 'Valid status transitions', statement: 'Only valid status transitions are allowed (e.g. draft > not_started > building > built, any > deprecated).', acceptance_criteria: ['Invalid transitions return an error', 'Built > building is allowed for rework'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { name: 'Log status changes', statement: 'Log every status change with who did it and when.', acceptance_criteria: ['Each entry has previous/new status, timestamp, author', 'Append-only — cannot edit or delete log entries'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { name: 'Version requirement payloads', statement: 'Version requirement payloads on every edit so you can see what changed over time.', acceptance_criteria: ['Each edit creates a new version with full payload snapshot', 'Previous versions are retrievable'] } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { name: 'Project status summary', statement: 'Show a project-level summary of how many nodes are in each status.', acceptance_criteria: ['Breakdown by status and type', 'Computable on demand'] } });

  // ── CHAT ──────────────────────────────────────────────────────
  const chatSub = await makeSubsystem({
    prefix: 'CHAT',
    parentId: sysId,
    name: 'Chat System',
    purpose: 'Node-scoped conversations between humans and AI. Chat history is a first-class artifact tied to each node.',
  });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { name: 'Multiple chats per node', statement: 'Each node can have multiple chat threads; users can browse, start new, and switch between them.', acceptance_criteria: ['List of chats shown per node', 'New chat creates a fresh thread', 'Switching chats updates the message panel'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { name: 'Message authorship tracking', statement: 'Messages record who sent them, when, and whether they are human or AI.', acceptance_criteria: ['Messages are append-only', 'Timestamps are UTC'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { name: 'Export chat as JSON', statement: 'Export a node chat thread as structured JSON so agents can consume it as context.', acceptance_criteria: ['Export includes node metadata, payload, and full message history'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { name: 'Stream AI token-by-token', statement: 'AI responses stream token-by-token so you see them as they are generated.', acceptance_criteria: ['SSE stream with individual tokens', 'Full message persisted after stream completes'] } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { name: 'Accept AI-proposed changes', statement: 'When AI proposes a change to a node during chat, an Accept button lets you commit it as a new version.', acceptance_criteria: ['Accept creates a new payload version with changelog entry', 'Works on any node, not just during the build flow', 'Rejected proposals stay in chat but do not alter the node'] } });

  // ── SNAP ──────────────────────────────────────────────────────
  const snapSub = await makeSubsystem({
    prefix: 'SNAP',
    parentId: sysId,
    name: 'Snapshot & Diff Engine',
    purpose: 'Point-in-time snapshots of the full project and diffs between any two snapshots.',
  });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { name: 'On-demand project snapshot', statement: 'Take a snapshot of the entire project graph on demand — every node, payload, and status.', acceptance_criteria: ['Timestamped and optionally named', 'Immutable once created'] } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { name: 'List project snapshots', statement: 'List all snapshots for a project, newest first.', acceptance_criteria: ['Shows name, timestamp, and node count'] } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { name: 'Diff two snapshots', statement: 'Diff any two snapshots to see what changed — nodes added, removed, status changes, payload edits.', acceptance_criteria: ['Field-level diffs for payload changes', 'Structured JSON output'] } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { name: 'Export snapshot as JSON', statement: 'Export a snapshot as a standalone JSON file that can be re-imported to seed a new project.', acceptance_criteria: ['Includes full graph, changelogs, versions', 'Re-imported projects are independent copies'] } });

  // ── API ───────────────────────────────────────────────────────
  const apiSub = await makeSubsystem({
    prefix: 'API',
    parentId: sysId,
    name: 'API Layer',
    purpose: 'HTTP interface exposing Atlas to external apps and agents.',
  });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { name: 'Read node by ID', statement: 'Read any node by ID with full payload, status, parent, and dependencies.', acceptance_criteria: ['GET /nodes/:id', '404 for missing nodes'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { name: 'List node children', statement: 'List children of a node with optional type filter.', acceptance_criteria: ['GET /nodes/:id/children?type=...', 'Empty array when none exist'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { name: 'Update node status', statement: 'Update a node status with transition enforcement.', acceptance_criteria: ['PATCH /nodes/:id/status', 'Invalid transitions return 400'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { name: 'Create and update nodes', statement: 'Create and update nodes with hierarchy validation.', acceptance_criteria: ['POST /nodes creates', 'PATCH /nodes/:id updates payload', 'Both enforce parent-child rules'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { name: 'Get node chat thread', statement: 'Retrieve a node chat thread as a context payload.', acceptance_criteria: ['GET /nodes/:id/chats returns node chats', 'GET /chats/:id returns messages', 'Empty history if no messages'] } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { name: 'Post chat message', statement: 'Post a message to a chat thread.', acceptance_criteria: ['POST /chats/:id/messages', 'Returns the created message with timestamp'] } });

  // ── UI ────────────────────────────────────────────────────────
  const uiSub = await makeSubsystem({
    prefix: 'UI',
    parentId: sysId,
    name: 'Builder Interface',
    purpose: 'The web app — tree navigation, node editing, chat, and the guided build flow for creating projects.',
  });

  // Core UI
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Collapsible node tree', statement: 'Show the node hierarchy as a collapsible tree that lazy-loads children when you expand a node.', acceptance_criteria: ['Clicking a node selects it for editing', 'Status shown as colored badges', 'Draft nodes are visually distinct'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Type-specific node editors', statement: 'Provide type-specific editors (project, system, subsystem, requirement) that auto-save on blur.', acceptance_criteria: ['Each type shows relevant fields', 'Changes persist automatically'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Valid status dropdown', statement: 'Status dropdown only allows valid transitions — invalid options are disabled.', acceptance_criteria: ['Changelog updates after a status change'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Node-scoped chat panel', statement: 'Chat panel on every node with multiple threads, human messages, and streaming AI responses.', acceptance_criteria: ['Chat list shows all threads for node', 'Messages appear immediately', 'AI streams token-by-token'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Resizable panels', statement: 'Resizable panels — drag the dividers between tree, editor, and chat to control their width.', acceptance_criteria: ['Panels have min/max constraints so nothing collapses completely'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'URL-addressable nodes', statement: 'Each node has a URL (/node/:id) so it can be linked and loaded directly.', acceptance_criteria: ['Navigating to /node/:id selects that node', 'URL updates when you click a node in the tree'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'AI propose-and-accept edits', statement: 'AI can propose changes to node fields inline in chat; user clicks Accept to apply them.', acceptance_criteria: ['Proposal card shows current vs proposed value', 'Accept calls PATCH and refreshes the editor', 'Reject dismisses without saving'] } });

  // Build flow
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Create project button', statement: 'A "Create Project" button that launches the guided build flow.', acceptance_criteria: ['Enters a wizard-style guided experience', 'Creates a new project node in draft status'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Deep questioning phase', statement: 'Deep questioning phase — AI asks about what you are building, why, for whom, and what success looks like before proposing any structure.', acceptance_criteria: ['Conversation saved to the project node chat', 'AI signals when it is ready to propose subsystems', 'User can keep going or trigger proposals early'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'AI proposes subsystems', statement: 'AI proposes subsystems from the discovery conversation, shown as a batch for review.', acceptance_criteria: ['Each subsystem shows name, purpose, abbreviation', 'User can accept, deny, edit, or add new ones', 'Accepted subsystems become real nodes in the tree'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Per-subsystem deep dive', statement: 'Per-subsystem deep dive — AI asks targeted questions then proposes requirements, each saved to the subsystem chat thread.', acceptance_criteria: ['User steps into each subsystem for focused discussion', 'Chat is forked to the subsystem node'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Requirement review flow', statement: 'Requirement review — accept, dive in to edit via chat, or skip to come back later.', acceptance_criteria: ['Accepted requirements become nodes under the subsystem', 'Diving in opens a chat thread on that requirement', 'Skipped items stay as drafts'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Draft nodes for proposals', statement: 'Draft nodes for anything AI proposes but the user has not yet reviewed.', acceptance_criteria: ['Drafts are visually distinct in the tree', 'Accepting promotes to not_started', 'Denying removes the node'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'Build progress overview', statement: 'Build progress overview — shows the full hierarchy with what is done vs skipped, letting you jump into any incomplete item.', acceptance_criteria: ['Visible when re-entering the build flow', 'Skipped and draft items are clearly marked'] } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { name: 'AI follow-up questions', statement: 'AI asks follow-up questions when the user significantly changes or adds to what was proposed.', acceptance_criteria: ['Edits or additions trigger clarifying questions', 'Feels conversational, not interrogative'] } });

  console.log('\nSeed complete.');
}

seed()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
