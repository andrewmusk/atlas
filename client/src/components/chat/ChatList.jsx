import { useChats, useCreateChat } from '../../hooks/useChat.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import './ChatList.css';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function previewContent(content) {
  if (!content) return '';
  // Strip JSON wrapper if structured message
  try {
    const p = JSON.parse(content);
    if (p && typeof p.text === 'string') return p.text;
  } catch {}
  return content;
}

export default function ChatList({ nodeId }) {
  const selectChat = useAtlasStore((s) => s.selectChat);
  const { data: chats = [], isLoading } = useChats(nodeId);
  const createChat = useCreateChat(nodeId);

  const handleNew = async () => {
    const chat = await createChat.mutateAsync({});
    selectChat(chat.id);
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <span className="chat-list-title">Conversations</span>
        <button
          className="chat-list-new"
          onClick={handleNew}
          disabled={createChat.isPending}
        >
          + New
        </button>
      </div>

      {isLoading && <div className="chat-list-loading">Loading…</div>}

      {!isLoading && chats.length === 0 && (
        <div className="chat-list-empty">
          <span>No conversations yet.</span>
          <span>Start one to chat with AI about this node.</span>
        </div>
      )}

      {chats.map((chat) => {
        const preview = chat.lastMessage
          ? previewContent(chat.lastMessage.content).substring(0, 100)
          : null;

        return (
          <button
            key={chat.id}
            className="chat-list-item"
            onClick={() => selectChat(chat.id)}
          >
            <div className="chat-list-item-meta">
              <span className="chat-list-item-title">
                {chat.title || formatDate(chat.createdAt)}
              </span>
              <span className="chat-list-item-count">
                {chat.messageCount} {chat.messageCount === 1 ? 'msg' : 'msgs'}
              </span>
            </div>
            {preview && (
              <div className="chat-list-item-preview">{preview}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
