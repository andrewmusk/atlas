const VALID_PARENT_TYPES = {
  project: null,          // top-level, no parent
  system: 'project',
  subsystem: 'system',
  requirement: 'subsystem',
  flow: 'subsystem',
};

/**
 * Validate that a parent node is acceptable for the given child type.
 * @param {string} childType
 * @param {object|null} parentNode - the fetched parent node (or null)
 */
export function validateParentChild(childType, parentNode) {
  const requiredParentType = VALID_PARENT_TYPES[childType];

  if (requiredParentType === undefined) {
    throw new Error(`Unknown node type: ${childType}`);
  }

  if (requiredParentType === null) {
    // project nodes have no parent
    if (parentNode) throw new Error('Project nodes cannot have a parent');
    return;
  }

  if (!parentNode) {
    throw new Error(`A ${childType} must have a parent of type ${requiredParentType}`);
  }

  if (parentNode.type !== requiredParentType) {
    throw new Error(
      `A ${childType} must have a parent of type "${requiredParentType}", got "${parentNode.type}"`
    );
  }
}

/**
 * Walk up the ancestor chain to find the subsystem node, then return its abbreviation.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} node - node to start from
 * @returns {Promise<string>} abbreviation (e.g. "HIER")
 */
export async function deriveSubsystemAbbrev(prisma, node) {
  // If this node IS the subsystem, return its own abbreviation
  if (node.type === 'subsystem') {
    const abbrev = node.payload?.abbreviation;
    if (!abbrev) throw new Error(`Subsystem ${node.id} is missing payload.abbreviation`);
    return abbrev;
  }

  // Walk up to find the subsystem ancestor
  let current = node;
  while (current.parentId) {
    current = await prisma.node.findUnique({ where: { id: current.parentId } });
    if (!current) throw new Error('Broken parent chain — ancestor not found');
    if (current.type === 'subsystem') {
      const abbrev = current.payload?.abbreviation;
      if (!abbrev) throw new Error(`Subsystem ${current.id} is missing payload.abbreviation`);
      return abbrev;
    }
  }

  // Special case: system or project level nodes use their own prefix
  if (node.type === 'system') return node.payload?.abbreviation || 'SYS';
  if (node.type === 'project') return node.payload?.abbreviation || 'PROJ';

  throw new Error(`Could not find subsystem ancestor for node ${node.id}`);
}
