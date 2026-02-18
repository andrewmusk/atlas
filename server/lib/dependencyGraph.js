/**
 * Detect if adding an edge from sourceId → targetId would create a cycle.
 * Uses DFS over the NodeDependency table.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} sourceId - new edge origin
 * @param {string} targetId - new edge destination
 * @returns {Promise<boolean>} true if cycle detected
 */
export async function detectCycle(prisma, sourceId, targetId) {
  // If target can reach source, adding source→target would create a cycle
  const visited = new Set();

  async function canReach(from, to) {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);

    const outgoing = await prisma.nodeDependency.findMany({
      where: { sourceId: from },
      select: { targetId: true },
    });

    for (const dep of outgoing) {
      if (await canReach(dep.targetId, to)) return true;
    }

    return false;
  }

  return canReach(targetId, sourceId);
}
