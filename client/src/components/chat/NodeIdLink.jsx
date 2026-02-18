import useAtlasStore from '../../store/useAtlasStore.js';

// Matches patterns like HIER-REQ-001, CHAT-CAP-002, API-REQ-005, etc.
const NODE_ID_REGEX = /\b([A-Z]{2,8}-(?:PROJ|SYS|SUB|CAP|REQ|FLO)-\d{3})\b/g;

export default function NodeIdLink({ text }) {
  const selectNode = useAtlasStore((s) => s.selectNode);

  const parts = [];
  let last = 0;
  let match;

  NODE_ID_REGEX.lastIndex = 0;
  while ((match = NODE_ID_REGEX.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const id = match[1];
    parts.push(
      <button
        key={`${id}-${match.index}`}
        onClick={() => selectNode(id)}
        style={{
          color: 'var(--accent)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 'inherit',
          padding: '0 1px',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
        }}
        title={`Navigate to ${id}`}
      >
        {id}
      </button>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return <>{parts}</>;
}
