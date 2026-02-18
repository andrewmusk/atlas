import { useState } from 'react';
import './ChangelogPanel.css';

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ChangelogPanel({ entries = [] }) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="changelog-panel">
      <button className="changelog-toggle" onClick={() => setOpen((o) => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        <span>Changelog</span>
        <span className="changelog-count">{entries.length}</span>
      </button>

      {open && (
        <div className="changelog-entries">
          {[...entries].reverse().map((e) => (
            <div key={e.id} className="changelog-entry">
              <div className="changelog-meta">
                <span className="changelog-type">{e.changeType}</span>
                <span className="changelog-author">{e.author}</span>
                <span className="changelog-time">{formatTime(e.timestamp)}</span>
              </div>
              {e.previousStatus && (
                <div className="changelog-transition">
                  {e.previousStatus} → {e.newStatus}
                </div>
              )}
              {e.summary && <div className="changelog-summary">{e.summary}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
