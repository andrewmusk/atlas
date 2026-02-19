import { useState } from 'react';
import { useChats, useCreateChat, useChat } from '../../hooks/useChat.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import ChatThread from '../chat/ChatThread.jsx';
import ChatInput from '../chat/ChatInput.jsx';
import './EditorChatsTab.css';

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function previewContent(content) {
  if (!content) return '';
  try {
    const p = JSON.parse(content);
    if (p && typeof p.text === 'string') return p.text;
  } catch {}
  return content;
}

function ChatListView({ node, onSelect }) {
  const { data: chats = [], isLoading } = useChats(node.id);
  const createChat = useCreateChat(node.id);

  const handleNew = async () => {
    const chat = await createChat.mutateAsync({});
    onSelect(chat.id);
  };

  return (
    <div className="ect-list">
      <div className="ect-list-header">
        <span className="ect-list-title">Conversations</span>
        <button
          className="ect-list-new"
          onClick={handleNew}
          disabled={createChat.isPending}
        >
          + New
        </button>
      </div>

      {isLoading && <div className="ect-empty">Loading…</div>}

      {!isLoading && chats.length === 0 && (
        <div className="ect-empty">
          <span>No conversations yet.</span>
          <span>Start one to chat about this node.</span>
        </div>
      )}

      {chats.map((chat) => {
        const preview = chat.lastMessage
          ? previewContent(chat.lastMessage.content).substring(0, 100)
          : null;

        return (
          <button
            key={chat.id}
            className="ect-item"
            onClick={() => onSelect(chat.id)}
          >
            <div className="ect-item-meta">
              <span className="ect-item-title">
                {chat.title || formatDate(chat.createdAt)}
              </span>
              <span className="ect-item-count">
                {chat.messageCount} {chat.messageCount === 1 ? 'msg' : 'msgs'}
              </span>
            </div>
            {preview && <div className="ect-item-preview">{preview}</div>}
          </button>
        );
      })}
    </div>
  );
}

function ChatThreadView({ chatId, nodeId, onBack }) {
  const { authorLabel, sessionId } = useAtlasStore();
  const {
    data: chatData,
    isLoading,
    streamingMessage,
    proposals,
    sendMessage,
    sendAiMessage,
  } = useChat(chatId);

  const messages = chatData?.messages || [];
  const isStreaming = !!streamingMessage;

  const handleSend = async (content) => {
    await sendMessage({ content, author: authorLabel, authorType: 'human', sessionId });
  };

  const handleAsk = async (content) => {
    await sendAiMessage({ content, author: authorLabel, authorType: 'human', sessionId });
  };

  return (
    <div className="ect-thread-view">
      <div className="ect-thread-header">
        <button className="ect-back-btn" onClick={onBack} title="All conversations">‹</button>
        <span className="ect-thread-title">
          {isLoading ? 'Loading…' : (chatData?.title || formatDate(chatData?.createdAt))}
        </span>
      </div>
      <ChatThread
        messages={messages}
        streamingMessage={streamingMessage}
        proposals={proposals}
        nodeId={nodeId}
      />
      <ChatInput onSend={handleSend} onAsk={handleAsk} disabled={isStreaming} />
    </div>
  );
}

export default function EditorChatsTab({ node }) {
  const [selectedChatId, setSelectedChatId] = useState(null);

  return (
    <div className="editor-chats-tab">
      {selectedChatId ? (
        <ChatThreadView
          chatId={selectedChatId}
          nodeId={node.id}
          onBack={() => setSelectedChatId(null)}
        />
      ) : (
        <ChatListView node={node} onSelect={setSelectedChatId} />
      )}
    </div>
  );
}
