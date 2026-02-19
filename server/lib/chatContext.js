/**
 * Tool definition for AI to propose node field edits.
 */
export const PROPOSE_EDIT_TOOL = {
  name: 'propose_edit',
  description:
    "Propose a change to a specific field in the current node's payload. The user will see a card with the current and proposed values and can Accept or Reject it. Use this whenever the user asks you to change, improve, or rewrite a field.",
  input_schema: {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        description:
          'The payload field to change (e.g. "statement", "acceptance_criteria", "name", "purpose", "description").',
      },
      old_value: {
        description: 'The current value of the field (for display). Omit if the field is empty.',
      },
      new_value: {
        description:
          'The proposed new value. For array fields like acceptance_criteria, use an array of strings.',
      },
      reasoning: {
        type: 'string',
        description: 'One sentence explaining why this change improves the node.',
      },
    },
    required: ['field', 'new_value', 'reasoning'],
  },
};

/**
 * Build the Anthropic system prompt for a node-scoped chat.
 * @param {object} node - full node with payload
 * @returns {string}
 */
export function buildSystemPrompt(node) {
  const payloadFields = Object.keys(node.payload || {}).join(', ');

  return `You are an AI assistant helping refine a node in the Atlas company state machine.

Node ID: ${node.id}
Node Type: ${node.type}
Status: ${node.status}
Parent ID: ${node.parentId || 'none'}

Current payload:
${JSON.stringify(node.payload, null, 2)}

Your role: Help clarify, refine, and reason about this specific ${node.type} node. Stay scoped to this node and its context. When referencing other nodes, use their IDs (e.g. HIER-REQ-001). Be concise and technical.

When the user asks you to change, rewrite, or improve any field in this node's payload, use the propose_edit tool to propose the change — do not just describe it in text. Available payload fields: ${payloadFields || 'none'}. Do not make multiple proposals for the same field in one response.`;
}

/**
 * Convert stored ChatMessage rows to Anthropic API message format.
 * For assistant messages with structured JSON content (text + proposals),
 * only the text portion is replayed to avoid tool_use/tool_result complexities.
 * @param {Array} messages - ChatMessage rows from DB
 * @returns {Array<{role: string, content: string}>}
 */
export function buildMessagesArray(messages) {
  return messages.map((m) => {
    let content = m.content;
    if (m.role === 'assistant') {
      try {
        const parsed = JSON.parse(m.content);
        if (parsed && typeof parsed.text === 'string') {
          content = parsed.text || '(proposed edits)';
        }
      } catch {
        // plain text, use as-is
      }
    }
    return { role: m.role, content };
  });
}
