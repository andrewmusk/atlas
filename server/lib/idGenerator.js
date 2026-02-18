const TYPE_ABBREV = {
  project: 'PROJ',
  system: 'SYS',
  subsystem: 'SUB',
  capability: 'CAP',
  requirement: 'REQ',
  flow: 'FLO',
};

/**
 * Generate the next ID for a node.
 * Format: [SUBSYS_ABBREV]-[TYPE_ABBREV]-[NNN]
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} subsystemAbbrev - e.g. "HIER"
 * @param {string} type - e.g. "requirement"
 * @returns {Promise<string>}
 */
export async function generateNodeId(prisma, subsystemAbbrev, type) {
  const typeAbbrev = TYPE_ABBREV[type];
  if (!typeAbbrev) throw new Error(`Unknown node type: ${type}`);

  const prefix = `${subsystemAbbrev}-${typeAbbrev}`;

  const result = await prisma.$transaction(async (tx) => {
    return tx.idCounter.upsert({
      where: { prefix },
      update: { count: { increment: 1 } },
      create: { prefix, count: 1 },
    });
  });

  return `${prefix}-${String(result.count).padStart(3, '0')}`;
}
