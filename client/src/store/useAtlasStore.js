import { create } from 'zustand';

// Generate or retrieve a persistent session ID for anonymous attribution
function getSessionId() {
  let id = localStorage.getItem('atlas_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('atlas_session_id', id);
  }
  return id;
}

const useAtlasStore = create((set, get) => ({
  // The currently selected node ID (drives center + right panels)
  selectedNodeId: null,
  selectNode: (id) => set({ selectedNodeId: id }),

  // Expand/collapse state for tree nodes
  expandedNodes: new Set(),
  toggleExpand: (id) => {
    const expanded = new Set(get().expandedNodes);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedNodes: expanded });
  },
  setExpanded: (id, value) => {
    const expanded = new Set(get().expandedNodes);
    if (value) expanded.add(id);
    else expanded.delete(id);
    set({ expandedNodes: expanded });
  },

  // Session ID for anonymous attribution
  sessionId: getSessionId(),

  // Author label (display name) — editable by user
  authorLabel: localStorage.getItem('atlas_author_label') || 'You',
  setAuthorLabel: (label) => {
    localStorage.setItem('atlas_author_label', label);
    set({ authorLabel: label });
  },
}));

export default useAtlasStore;
