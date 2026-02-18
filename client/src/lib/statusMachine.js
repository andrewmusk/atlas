// Client-side mirror of server status machine
export const VALID_STATUSES = ['not_started', 'building', 'built', 'deprecated'];

export const VALID_TRANSITIONS = {
  not_started: ['building', 'deprecated'],
  building: ['built', 'deprecated'],
  built: ['building', 'deprecated'],
  deprecated: [],
};
