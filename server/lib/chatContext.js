/**
 * Build the Anthropic system prompt for a node-scoped chat.
 * @param {object} node - full node with payload
 * @returns {string}
 */
export function buildSystemPrompt(node) {
  return `You are an AI assistant helping refine a node in the Atlas company state machine.

Node ID: ${node.id}
Node Type: ${node.type}
Status: ${node.status}
Parent ID: ${node.parentId || 'none'}

Current payload:
${JSON.stringify(node.payload, null, 2)}

Your role: Help clarify, refine, and reason about this specific ${node.type} node. Stay scoped to this node and its context. When referencing other nodes, use their IDs (e.g. HIER-REQ-001). Be concise and technical.`;
}

/**
 * Convert stored ChatMessage rows to Anthropic API message format.
 * @param {Array} messages - ChatMessage rows from DB
 * @returns {Array<{role: string, content: string}>}
 */
export function buildMessagesArray(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
