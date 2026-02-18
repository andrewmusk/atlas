import { useState, useRef } from 'react';
import './ChatInput.css';

export default function ChatInput({ onSend, onAsk, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) handleSend();
    }
  };

  const handleSend = () => {
    const content = value.trim();
    if (!content) return;
    setValue('');
    onSend(content);
    textareaRef.current?.focus();
  };

  const handleAsk = () => {
    const content = value.trim();
    if (!content) return;
    setValue('');
    onAsk(content);
    textareaRef.current?.focus();
  };

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        className="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message… (Enter to send, Shift+Enter for newline)"
        disabled={disabled}
        rows={3}
      />
      <div className="chat-input-actions">
        <span className="chat-input-hint">⏎ send · ⇧⏎ newline</span>
        <button
          className="btn btn-ghost chat-btn"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
        >
          Send
        </button>
        <button
          className="btn btn-primary chat-btn"
          onClick={handleAsk}
          disabled={disabled || !value.trim()}
        >
          Ask AI ✦
        </button>
      </div>
    </div>
  );
}
