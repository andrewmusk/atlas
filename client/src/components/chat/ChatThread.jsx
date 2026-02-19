import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage.jsx';
import ProposalCard from './ProposalCard.jsx';
import './ChatThread.css';

export default function ChatThread({ messages, streamingMessage, proposals = [], nodeId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage?.content, proposals.length]);

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="thread-empty">
        <span>No messages yet.</span>
        <span>Ask a question or use Ask AI to start a conversation.</span>
      </div>
    );
  }

  return (
    <div className="chat-thread">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} nodeId={nodeId} />
      ))}
      {streamingMessage && (
        <ChatMessage
          message={{
            id: 'streaming',
            role: 'assistant',
            authorLabel: 'Claude',
            content: streamingMessage.content,
          }}
          streaming
          nodeId={nodeId}
        />
      )}
      {/* Live proposals from the current stream (before message is persisted) */}
      {proposals.map((proposal, i) => (
        <ProposalCard key={`live-${i}`} proposal={proposal} nodeId={nodeId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
