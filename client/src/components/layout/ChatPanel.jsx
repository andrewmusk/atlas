import { useChat } from '../../hooks/useChat.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import ChatThread from '../chat/ChatThread.jsx';
import ChatInput from '../chat/ChatInput.jsx';
import NodeChatList from '../chat/NodeChatList.jsx';
import './ChatPanel.css';

export default function ChatPanel({ nodeId }) {
  const { authorLabel, sessionId } = useAtlasStore();
  const {
    data,
    isLoading,
    streamingMessage,
    sendMessage,
    sendAiMessage,
  } = useChat(nodeId);

  const messages = data?.messages || [];
  const nodeType = data?.node?.type || null;
  const isStreaming = !!streamingMessage;

  const handleSend = async (content) => {
    await sendMessage({ content, author: authorLabel, authorType: 'human', sessionId });
  };

  const handleAsk = async (content) => {
    await sendAiMessage({ content, author: authorLabel, authorType: 'human', sessionId });
  };

  return (
    <aside className="chat-panel">
      <div className="panel-header">
        <span className="panel-title">
          {nodeId ? `Chat · ${nodeId}` : 'Chat'}
        </span>
        {isLoading && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>loading…</span>}
      </div>

      {!nodeId ? (
        <div className="empty-state">
          <span>Select a node to chat</span>
        </div>
      ) : (
        <>
          <NodeChatList nodeId={nodeId} nodeType={nodeType} />
          <ChatThread messages={messages} streamingMessage={streamingMessage} />
          <ChatInput onSend={handleSend} onAsk={handleAsk} disabled={isStreaming} />
        </>
      )}
    </aside>
  );
}
