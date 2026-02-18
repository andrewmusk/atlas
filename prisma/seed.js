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
    purpose: 'Owns the creation and organization of the full node graph. Core data layer.',
  });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall support creating nodes of type: project, system, subsystem, requirement, flow.', acceptance_criteria: ['Each node type has required and optional fields', 'Node creation validates required fields before saving', 'Missing required fields return a descriptive validation error'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall support reading a single node by ID, returning its full payload, status, parent, and dependencies.', acceptance_criteria: ['GET by node ID returns all fields', 'Non-existent node ID returns a 404 with descriptive message'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall support updating the payload of any node via partial merge.', acceptance_criteria: ['Update is partial — only provided fields are changed', 'Update triggers a changelog entry', 'updated_at timestamp is refreshed on every update'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall enforce a strict parent-child hierarchy: project → system → subsystem → requirement.', acceptance_criteria: ['A requirement cannot be created without a parent subsystem', 'Violations return a descriptive error identifying the constraint broken'], priority: 'Must', type: 'Constraint' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall support declaring dependency edges between requirement nodes.', acceptance_criteria: ['A requirement can reference one or more other requirement IDs as dependencies', 'Dependencies are returned when the requirement node is fetched', 'Attempting to delete a node that is depended on returns a warning'], priority: 'Should', type: 'Functional' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall detect and reject circular dependency edges.', acceptance_criteria: ['Before saving a new dependency edge, the system checks for cycles', 'If a cycle is detected, the save is rejected with an error identifying the cycle path', 'No node is saved in an invalid state'], priority: 'Should', type: 'Constraint' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall auto-generate unique, human-readable IDs for each node based on subsystem and type.', acceptance_criteria: ['IDs follow the format [SUBSYSTEM-ABBREV]-[TYPE-ABBREV]-[NNN]', 'IDs are unique', 'IDs are immutable once assigned', 'The NNN counter increments per subsystem per type'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'HIER', parentId: hierSub, data: { statement: 'The system shall support listing all children of a node with optional type filtering.', acceptance_criteria: ['List endpoint accepts a parent node ID and optional type filter', 'Returns all direct children matching the filter', 'Returns empty array (not error) if no children exist'], priority: 'Must', type: 'Functional' } });

  // ── CLOG ──────────────────────────────────────────────────────
  const clogSub = await makeSubsystem({
    prefix: 'CLOG',
    parentId: sysId,
    name: 'Status & Changelog Engine',
    purpose: 'Tracks the lifecycle of every node. Every status transition and payload edit is logged.',
  });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'The system shall track status for every node using the values: not_started, building, built, deprecated.', acceptance_criteria: ['Default status on node creation is not_started', 'Status field is always present on any node', 'Invalid status values are rejected'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'The system shall enforce valid status transitions: not_started → building → built, and any → deprecated.', acceptance_criteria: ['Invalid transitions return an error', 'deprecated can be set from any status', 'Transition from built back to building is allowed (rework) and logged'], priority: 'Must', type: 'Constraint' } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'The system shall log every status transition with a timestamp and author.', acceptance_criteria: ['Each log entry contains: previous status, new status, timestamp, author ID, author type', 'Transition log is append-only', 'Log is accessible via the node changelog field'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'The system shall version requirement payloads on every edit, storing the full previous version.', acceptance_criteria: ['Every save of a requirement payload creates a new version entry', 'Each version stores: version number, timestamp, author, full payload snapshot', 'Previous versions are retrievable by version index'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CLOG', parentId: clogSub, data: { statement: 'The system shall produce a project-level state summary showing node counts by status across all types.', acceptance_criteria: ['Summary is computable on demand', 'Breakdown available at project level', 'Summary includes: total nodes, count per status, count per type'], priority: 'Should', type: 'Functional' } });

  // ── CHAT ──────────────────────────────────────────────────────
  const chatSub = await makeSubsystem({
    prefix: 'CHAT',
    parentId: sysId,
    name: 'Chat System',
    purpose: 'Node-scoped conversations between humans and agents. Chat history is a first-class artifact.',
  });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'The system shall support a single chat thread per node, created automatically on first message.', acceptance_criteria: ['One thread per node', 'Thread is created automatically on first message', 'Thread is retrievable by node ID', 'If no messages exist, returns empty thread (not 404)'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'The system shall record each message with author ID, author type, timestamp, and content.', acceptance_criteria: ['Author type is either human or agent', 'Timestamp is recorded in UTC', 'Messages are append-only — no editing or deletion'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'The system shall export a node chat thread as a structured JSON context payload for agent consumption.', acceptance_criteria: ['Export includes: node ID, node type, node payload, and full message history', 'Format is JSON', 'Export can be requested for any node regardless of whether it has messages'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'The system shall stream AI responses token-by-token via SSE.', acceptance_criteria: ['POST /nodes/:id/chat/ai returns an SSE stream', 'Each token is emitted as data: {"token":"..."}', 'Stream ends with data: [DONE]', 'Full AI message is persisted after stream completes'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'CHAT', parentId: chatSub, data: { statement: 'The system shall parse node ID references within messages and make them navigable in the UI.', acceptance_criteria: ['Node IDs in messages (e.g. HIER-REQ-001) are detected', 'Clicking a node ID reference navigates the tree to that node'], priority: 'Should', type: 'Functional' } });

  // ── SNAP ──────────────────────────────────────────────────────
  const snapSub = await makeSubsystem({
    prefix: 'SNAP',
    parentId: sysId,
    name: 'Snapshot & Diff Engine',
    purpose: 'Point-in-time snapshots of the full project state and diffs between any two snapshots.',
  });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'The system shall generate a full snapshot of the project node graph on demand.', acceptance_criteria: ['Snapshot captures every node with its full payload and current status', 'Snapshot is timestamped automatically', 'Snapshot can optionally be given a human-readable name', 'Snapshots are immutable once created'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'The system shall list all snapshots for a project in reverse chronological order.', acceptance_criteria: ['List returns: snapshot ID, name (if set), timestamp, node count'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'The system shall produce a structured diff between any two snapshots of the same project.', acceptance_criteria: ['Diff identifies: nodes added, nodes removed, status changes, payload changes', 'Payload changes show field-level old vs. new values', 'Diff is structured JSON'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'SNAP', parentId: snapSub, data: { statement: 'The system shall export any snapshot as a standalone JSON document that can be re-imported to seed a new project.', acceptance_criteria: ['Export includes: full node graph, all changelogs, all statuses, all requirement versions', 'An import endpoint recreates the full project state', 'Re-imported projects are independent copies'], priority: 'Should', type: 'Functional' } });

  // ── API ───────────────────────────────────────────────────────
  const apiSub = await makeSubsystem({
    prefix: 'API',
    parentId: sysId,
    name: 'API Layer',
    purpose: 'Exposes the full Atlas state to external applications and agents via HTTP.',
  });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'The system shall expose an endpoint to read any node by ID, returning its full payload, status, parent, and dependencies.', acceptance_criteria: ['GET /nodes/:id returns full node data', 'Non-existent ID returns 404 with message'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'The system shall expose an endpoint to list all children of a node with optional type filtering.', acceptance_criteria: ['GET /nodes/:id/children?type=requirement returns matching children', 'Returns empty array (not 404) when no children exist'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'The system shall expose an endpoint to update a node status with transition enforcement.', acceptance_criteria: ['PATCH /nodes/:id/status accepts { status, author, author_type }', 'Transition rules are enforced', 'Invalid transitions return 400'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'The system shall expose endpoints to create and update nodes.', acceptance_criteria: ['POST /nodes creates a node with the provided type, parent, and payload', 'PATCH /nodes/:id updates a node payload (partial update)', 'Both endpoints validate hierarchy rules'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'The system shall expose an endpoint to retrieve a node chat thread as a structured context payload.', acceptance_criteria: ['GET /nodes/:id/chat returns node metadata, full payload, and message history', 'Returns empty message history (not 404) if no messages exist'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'API', parentId: apiSub, data: { statement: 'The system shall expose an endpoint to post a message to a node chat thread.', acceptance_criteria: ['POST /nodes/:id/chat accepts { content, author, author_type }', 'Message is appended to the thread', 'Returns the created message with timestamp'], priority: 'Must', type: 'Functional' } });

  // ── UI ────────────────────────────────────────────────────────
  const uiSub = await makeSubsystem({
    prefix: 'UI',
    parentId: sysId,
    name: 'Builder Interface',
    purpose: 'Human-facing web app for navigating, editing, and chatting with Atlas nodes.',
  });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'The system shall display the full node hierarchy in a collapsible tree panel that lazy-loads children on expand.', acceptance_criteria: ['Tree shows all projects and their descendants', 'Clicking a node loads it in the center editor panel and auto-expands it', 'Children are loaded on demand'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'The system shall provide type-specific editors for each node type with auto-save on blur.', acceptance_criteria: ['Each node type renders the relevant payload fields', 'Changes are persisted automatically', 'System editor shows child subsystems; subsystem editor shows child requirements'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'The system shall enforce valid status transitions in the UI, disabling invalid options in the status dropdown.', acceptance_criteria: ['Invalid transition targets are shown as disabled', 'On change, the status is PATCH-ed to the API', 'Changelog panel updates to reflect the new entry'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'UI', parentId: uiSub, data: { statement: 'The system shall provide a chat panel per node that supports human messages and streaming AI responses.', acceptance_criteria: ['Human messages are posted and immediately visible', 'AI responses stream token-by-token', 'Node ID references in chat messages are clickable and navigate the tree', 'Child node chats are browsable from the chat panel'], priority: 'Must', type: 'Functional' } });

  // ── BUILD ────────────────────────────────────────────────────
  const buildSub = await makeSubsystem({
    prefix: 'BUILD',
    parentId: sysId,
    name: 'Build System',
    purpose: 'Guided project creation and refinement workflow. Steps users through defining systems, subsystems, and requirements via conversational AI with structured review gates.',
  });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall provide a Create Project entry point that launches a guided build flow.', acceptance_criteria: ['Create Project button visible from the main UI', 'Clicking it enters the build wizard — a full-screen guided flow', 'A new project node is created in draft status on entry'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall conduct a deep questioning phase to understand the project domain, users, goals, and scope before proposing structure.', acceptance_criteria: ['AI asks open-ended questions about what the user is building, why, and for whom', 'Conversation is saved to the project node chat thread', 'AI signals readiness to propose subsystems but user can continue or trigger it early', 'Questioning covers: what it is, why it exists, who it serves, what success looks like'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall generate candidate subsystem definitions from the discovery conversation and present them for batch review.', acceptance_criteria: ['AI proposes subsystems with name, purpose, and abbreviation', 'All candidates shown together in a reviewable list', 'User can accept, deny, or edit each subsystem', 'User can add new subsystems not proposed by the AI', 'Accepted subsystems are created as nodes in the hierarchy'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall support a per-subsystem deep dive where the AI asks targeted questions and then proposes requirements.', acceptance_criteria: ['After subsystem review, user enters each subsystem for focused discussion', 'AI asks questions specific to the subsystem domain', 'AI proposes an initial set of requirements based on the conversation', 'Subsystem chat thread is saved to the subsystem node (fork model)'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall present proposed requirements for review with accept, edit, and skip actions.', acceptance_criteria: ['Requirements shown in a reviewable list per subsystem', 'User can accept a requirement as-is', 'User can dive into a requirement to edit via chat, then accept', 'User can skip a requirement to revisit later', 'Accepted requirements are created as nodes under the subsystem'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall support a draft node status for AI-proposed nodes that have not yet been reviewed.', acceptance_criteria: ['Nodes created by the build flow start in draft status', 'Draft nodes are visually distinct in the tree (different styling/icon)', 'Accepting a draft promotes it to not_started', 'Denying a draft deletes or archives the node', 'Draft → not_started is the only valid transition from draft'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall track build progress on nodes so users can skip items and return to complete them later.', acceptance_criteria: ['Each node tracks its build review state (e.g. skipped, reviewed, accepted) in its payload', 'Re-entering the build flow shows a hierarchy overview with completion indicators', 'User can dive into any incomplete item from the overview', 'Skipped subsystems and requirements are clearly marked'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall fork chat context per node during the build flow so each node retains only its relevant conversation history.', acceptance_criteria: ['Project-level discovery chat is saved to the project node', 'Subsystem-level discussion is saved to the subsystem node', 'Requirement-level editing chat is saved to the requirement node', 'Diving into a child node starts a new chat thread on that node'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall support accepting AI-proposed changes to existing nodes from regular chat, creating a new payload version.', acceptance_criteria: ['When AI proposes a change during chat, an Accept button appears', 'Accepting commits the change as a new payload version with changelog entry', 'The accept action is available on any node, not just during the build flow', 'Rejected proposals remain in chat history but do not alter the node'], priority: 'Must', type: 'Functional' } });
  await makeReq({ prefix: 'BUILD', parentId: buildSub, data: { statement: 'The system shall ask follow-up questions when the user significantly alters proposed subsystems or requirements during review.', acceptance_criteria: ['If user edits or adds subsystems during batch review, AI asks clarifying questions about the changes before proceeding', 'If user adds requirements not derived from the conversation, AI asks for context', 'Follow-up questioning is conversational, not interrogative'], priority: 'Should', type: 'Functional' } });

  console.log('\nSeed complete.');
}

seed()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
