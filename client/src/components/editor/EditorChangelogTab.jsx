import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateNode } from '../../hooks/useNode.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import './EditorChangelogTab.css';

function formatDateTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDay(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function groupByDay(entries) {
  const groups = [];
  let currentDay = null;
  let currentGroup = null;
  for (const entry of entries) {
    const day = formatDay(entry.timestamp);
    if (day !== currentDay) {
      currentDay = day;
      currentGroup = { day, entries: [] };
      groups.push(currentGroup);
    }
    currentGroup.entries.push(entry);
  }
  return groups;
}

function diffPayloads(prev, next) {
  if (!prev) return [];
  const changes = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of allKeys) {
    const prevVal = JSON.stringify(prev[key]);
    const nextVal = JSON.stringify(next[key]);
    if (prevVal !== nextVal) {
      if (!(key in prev)) {
        changes.push({ key, type: 'added', value: next[key] });
      } else if (!(key in next)) {
        changes.push({ key, type: 'removed', value: prev[key] });
      } else {
        changes.push({ key, type: 'changed', from: prev[key], to: next[key] });
      }
    }
  }
  return changes;
}

function truncate(val, max = 80) {
  const s = Array.isArray(val) ? val.join('; ') : String(val ?? '');
  return s.length > max ? s.substring(0, max) + '…' : s;
}

function VersionEntry({ version, prevPayload, isLatest, onRestore, isRestoring }) {
  const [expanded, setExpanded] = useState(false);
  const diff = diffPayloads(prevPayload, version.payload);

  return (
    <div className="cl-version-entry">
      <div className="cl-version-header">
        <span className="cl-version-num">v{version.version}</span>
        <span className="cl-version-author">{version.author}</span>
        <span className="cl-version-time">{formatDateTime(version.timestamp)}</span>
        <div className="cl-version-actions">
          {diff.length > 0 && (
            <button
              className="cl-diff-toggle"
              onClick={() => setExpanded((o) => !o)}
            >
              {diff.length} change{diff.length !== 1 ? 's' : ''}
            </button>
          )}
          {isLatest ? (
            <span className="cl-version-current">current</span>
          ) : (
            <button
              className="cl-restore-btn"
              onClick={() => onRestore(version)}
              disabled={isRestoring}
            >
              Restore
            </button>
          )}
        </div>
      </div>

      {expanded && diff.length > 0 && (
        <div className="cl-diff">
          {diff.map((change) => (
            <div key={change.key} className={`cl-diff-row cl-diff-${change.type}`}>
              <span className="cl-diff-key">{change.key}</span>
              {change.type === 'changed' && (
                <>
                  <span className="cl-diff-from">{truncate(change.from)}</span>
                  <span className="cl-diff-arrow">→</span>
                  <span className="cl-diff-to">{truncate(change.to)}</span>
                </>
              )}
              {change.type === 'added' && (
                <span className="cl-diff-to">{truncate(change.value)}</span>
              )}
              {change.type === 'removed' && (
                <span className="cl-diff-from">{truncate(change.value)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CHANGE_TYPE_LABELS = {
  created: 'Created',
  status_transition: 'Status',
  payload_edit: 'Edit',
};

function ActivityEntry({ entry }) {
  return (
    <div className="cl-activity-entry">
      <div className="cl-activity-meta">
        <span className="cl-activity-type">
          {CHANGE_TYPE_LABELS[entry.changeType] || entry.changeType}
        </span>
        <span className="cl-activity-author">{entry.author}</span>
        <span className="cl-activity-time">{formatDateTime(entry.timestamp)}</span>
      </div>
      {entry.previousStatus && (
        <div className="cl-activity-transition">
          {entry.previousStatus} → {entry.newStatus}
        </div>
      )}
      {entry.summary && entry.changeType !== 'payload_edit' && (
        <div className="cl-activity-summary">{entry.summary}</div>
      )}
    </div>
  );
}

export default function EditorChangelogTab({ node }) {
  const { authorLabel } = useAtlasStore();
  const qc = useQueryClient();
  const { mutate: applyPayload, isPending: isRestoring } = useUpdateNode(node.id);

  const versions = node.payloadVersions || [];
  const changelog = [...(node.changelogEntries || [])].reverse();
  const dayGroups = groupByDay(changelog);

  const handleRestore = (version) => {
    applyPayload(
      { payload: version.payload, author: authorLabel, authorType: 'human' },
      { onSuccess: () => qc.invalidateQueries({ queryKey: ['node', node.id] }) }
    );
  };

  return (
    <div className="editor-changelog-tab">
      {versions.length > 0 && (
        <section className="cl-section">
          <div className="cl-section-title">Version History</div>
          <div className="cl-versions">
            {[...versions].reverse().map((v, i) => {
              const originalIndex = versions.length - 1 - i;
              const prevPayload = originalIndex > 0 ? versions[originalIndex - 1].payload : null;
              return (
                <VersionEntry
                  key={v.id}
                  version={v}
                  prevPayload={prevPayload}
                  isLatest={i === 0}
                  onRestore={handleRestore}
                  isRestoring={isRestoring}
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="cl-section">
        <div className="cl-section-title">Activity</div>
        {changelog.length === 0 && (
          <div className="cl-empty">No activity yet.</div>
        )}
        {dayGroups.map((group) => (
          <div key={group.day} className="cl-day-group">
            <div className="cl-day-header">{group.day}</div>
            {group.entries.map((entry) => (
              <ActivityEntry key={entry.id} entry={entry} />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
