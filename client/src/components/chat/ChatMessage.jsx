import ReactMarkdown from 'react-markdown';
import NodeIdLink from './NodeIdLink.jsx';
import './ChatMessage.css';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// Recursively extract plain text from react-markdown children
function extractText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children && typeof children === 'object' && children.props) {
    return extractText(children.props.children);
  }
  return String(children ?? '');
}

export default function ChatMessage({ message, streaming = false }) {
  const isHuman = message.role === 'user';

  return (
    <div className={`chat-message ${isHuman ? 'human' : 'ai'} ${streaming ? 'streaming' : ''}`}>
      <div className="chat-message-header">
        <span className="chat-author">{message.authorLabel || (isHuman ? 'You' : 'Claude')}</span>
        {message.createdAt && (
          <span className="chat-time">{formatTime(message.createdAt)}</span>
        )}
      </div>
      <div className="chat-message-body">
        {isHuman ? (
          <p><NodeIdLink text={message.content} /></p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p><NodeIdLink text={extractText(children)} /></p>,
              li: ({ children }) => <li><NodeIdLink text={extractText(children)} /></li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        {streaming && <span className="streaming-cursor">▌</span>}
      </div>
    </div>
  );
}
