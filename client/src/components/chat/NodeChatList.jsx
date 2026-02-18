import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChildren } from '../../api/atlas.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import './NodeChatList.css';

const STATUS_DOT = {
  not_started: '#555',
  building: '#d4a017',
  built: '#3a9b5c',
  deprecated: '#8b3a3a',
};

// Node types that have meaningful children worth browsing chats for
const HAS_CHAT_CHILDREN = ['project', 'system', 'subsystem', 'capability'];

export default function NodeChatList({ nodeId, nodeType }) {
  const [open, setOpen] = useState(false);
  const selectNode = useAtlasStore((s) => s.selectNode);

  const enabled = HAS_CHAT_CHILDREN.includes(nodeType);

  const { data: children = [] } = useQuery({
    queryKey: ['children', nodeId],
    queryFn: () => getChildren(nodeId),
    enabled: !!nodeId && enabled && open,
  });

  if (!enabled) return null;

  return (
    <div className="node-chat-list">
      <button className="node-chat-list-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="toggle-chevron">{open ? '▾' : '▸'}</span>
        <span>Child chats</span>
        {!open && <span className="toggle-hint">browse by node</span>}
      </button>

      {open && (
        <div className="node-chat-items">
          {children.length === 0 && (
            <div className="node-chat-empty">No children</div>
          )}
          {children.map((child) => {
            const name =
              child.payload?.name ||
              child.payload?.description?.substring(0, 50) ||
              child.payload?.statement?.substring(0, 50) ||
              child.id;

            return (
              <button
                key={child.id}
                className="node-chat-item"
                onClick={() => selectNode(child.id)}
              >
                <span
                  className="node-chat-dot"
                  style={{ background: STATUS_DOT[child.status] || '#555' }}
                />
                <span className="node-chat-id">{child.id}</span>
                <span className="node-chat-name">{name}</span>
                <span className="node-chat-arrow">›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
