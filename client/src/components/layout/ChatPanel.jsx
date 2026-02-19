import { useChat } from '../../hooks/useChat.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import ChatThread from '../chat/ChatThread.jsx';
import ChatInput from '../chat/ChatInput.jsx';
import ChatList from '../chat/ChatList.jsx';
import './ChatPanel.css';

export default function ChatPanel({ nodeId }) {
  const { authorLabel, sessionId, selectedChatId, selectChat } = useAtlasStore();
  const {
    data: chatData,
    isLoading,
    streamingMessage,
    proposals,
    sendMessage,
    sendAiMessage,
  } = useChat(selectedChatId);

  const messages = chatData?.messages || [];
  const isStreaming = !!streamingMessage;

  const handleSend = async (content) => {
    await sendMessage({ content, author: authorLabel, authorType: 'human', sessionId });
  };

  const handleAsk = async (content) => {
    await sendAiMessage({ content, author: authorLabel, authorType: 'human', sessionId });
  };

  const handleBack = () => selectChat(null);

  return (
    <aside className="chat-panel">
      <div className="panel-header">
        {selectedChatId ? (
          <>
            <button className="chat-back-btn" onClick={handleBack} title="All conversations">
              ‹
            </button>
            <span className="panel-title">
              {nodeId ? `Chat · ${nodeId}` : 'Chat'}
            </span>
            {isLoading && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>loading…</span>}
          </>
        ) : (
          <span className="panel-title">
            {nodeId ? `Chats · ${nodeId}` : 'Chat'}
          </span>
        )}
      </div>

      {!nodeId ? (
        <div className="empty-state">
          <span>Select a node to chat</span>
        </div>
      ) : !selectedChatId ? (
        <ChatList nodeId={nodeId} />
      ) : (
        <>
          <ChatThread
            messages={messages}
            streamingMessage={streamingMessage}
            proposals={proposals}
            nodeId={nodeId}
          />
          <ChatInput onSend={handleSend} onAsk={handleAsk} disabled={isStreaming} />
        </>
      )}
    </aside>
  );
}
