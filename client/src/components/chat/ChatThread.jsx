import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage.jsx';
import './ChatThread.css';

export default function ChatThread({ messages, streamingMessage }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage?.content]);

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
        <ChatMessage key={msg.id} message={msg} />
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
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
