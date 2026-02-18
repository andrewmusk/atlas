export const VALID_STATUSES = ['not_started', 'building', 'built', 'deprecated'];

export const VALID_TRANSITIONS = {
  not_started: ['building', 'deprecated'],
  building: ['built', 'deprecated'],
  built: ['building', 'deprecated'],
  deprecated: [],
};

/**
 * Validate a status transition.
 * @param {string} from
 * @param {string} to
 * @throws if transition is invalid
 */
export function validateTransition(from, to) {
  if (!VALID_STATUSES.includes(from)) {
    throw new Error(`Unknown current status: ${from}`);
  }
  if (!VALID_STATUSES.includes(to)) {
    throw new Error(`Unknown target status: ${to}`);
  }
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid status transition: ${from} → ${to}. Allowed from ${from}: [${allowed.join(', ')}]`
    );
  }
}
