/**
 * Write a status transition changelog entry.
 */
export async function writeStatusTransition(prisma, { nodeId, previousStatus, newStatus, author, authorType }) {
  return prisma.changelogEntry.create({
    data: {
      nodeId,
      changeType: 'status_transition',
      previousStatus,
      newStatus,
      summary: `Status changed from ${previousStatus} to ${newStatus}`,
      author,
      authorType,
    },
  });
}

/**
 * Write a payload edit changelog entry, and version the payload if node is a requirement.
 */
export async function writePayloadEdit(prisma, { node, newPayload, author, authorType }) {
  // Log the edit
  await prisma.changelogEntry.create({
    data: {
      nodeId: node.id,
      changeType: 'payload_edit',
      summary: `Payload updated by ${author}`,
      author,
      authorType,
    },
  });

  // Version full payload snapshots for requirements only
  if (node.type === 'requirement') {
    await writePayloadVersion(prisma, { nodeId: node.id, payload: newPayload, author, authorType });
  }
}

/**
 * Save a versioned snapshot of a requirement's payload.
 */
export async function writePayloadVersion(prisma, { nodeId, payload, author, authorType }) {
  // Get current max version
  const latest = await prisma.payloadVersion.findFirst({
    where: { nodeId },
    orderBy: { version: 'desc' },
  });

  const nextVersion = latest ? latest.version + 1 : 1;

  return prisma.payloadVersion.create({
    data: {
      nodeId,
      version: nextVersion,
      payload,
      author,
      authorType,
    },
  });
}

/**
 * Write a node-created changelog entry.
 */
export async function writeCreated(prisma, { nodeId, author, authorType }) {
  return prisma.changelogEntry.create({
    data: {
      nodeId,
      changeType: 'created',
      summary: `Node created by ${author}`,
      author,
      authorType,
    },
  });
}
