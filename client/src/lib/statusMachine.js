// Client-side mirror of server status machine
export const VALID_STATUSES = ['draft', 'not_started', 'building', 'built', 'deprecated'];

export const VALID_TRANSITIONS = {
  draft: ['not_started', 'deprecated'],
  not_started: ['building', 'deprecated'],
  building: ['built', 'deprecated'],
  built: ['building', 'deprecated'],
  deprecated: [],
};
