import { useState } from 'react';
import { useUpdateNode } from '../../hooks/useNode.js';
import StatusBadge from '../tree/StatusBadge.jsx';
import ChangelogPanel from '../shared/ChangelogPanel.jsx';
import './NodeEditor.css';
import './RequirementEditor.css';

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function RequirementEditor({ node }) {
  const [fields, setFields] = useState({ ...node.payload });
  const [criteriaText, setCriteriaText] = useState(
    Array.isArray(node.payload.acceptance_criteria)
      ? node.payload.acceptance_criteria.join('\n')
      : node.payload.acceptance_criteria || ''
  );
  const { mutate: savePayload } = useUpdateNode(node.id);

  const handleBlur = () => {
    const acceptance_criteria = criteriaText.split('\n').filter((s) => s.trim());
    savePayload({ payload: { ...fields, acceptance_criteria } });
  };

  const displayName = fields.statement
    ? fields.statement.substring(0, 60) + (fields.statement.length > 60 ? '…' : '')
    : node.id;

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-header-top">
          <span className="editor-node-type">{node.type}</span>
          <StatusBadge status={node.status} />
        </div>
        <div className="editor-node-name">{displayName}</div>
      </div>

      <div className="editor-body">
        <div className="field-group">
          <label>Statement</label>
          <textarea
            value={fields.statement || ''}
            onChange={(e) => setFields((f) => ({ ...f, statement: e.target.value }))}
            onBlur={handleBlur}
            rows={3}
            placeholder="The system shall..."
          />
        </div>

        <div className="field-group">
          <label>Acceptance Criteria <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(one per line)</span></label>
          <textarea
            value={criteriaText}
            onChange={(e) => setCriteriaText(e.target.value)}
            onBlur={handleBlur}
            rows={5}
            placeholder="- The system shall..."
          />
        </div>

        {node.payloadVersions && node.payloadVersions.length > 0 && (
          <div className="version-history">
            <div className="version-header">Version History ({node.payloadVersions.length})</div>
            {[...node.payloadVersions].reverse().map((v) => (
              <div key={v.id} className="version-entry">
                <span className="version-num">v{v.version}</span>
                <span className="version-author">{v.author}</span>
                <span className="version-time">{formatTime(v.timestamp)}</span>
              </div>
            ))}
          </div>
        )}

        <ChangelogPanel entries={node.changelogEntries || []} />
      </div>
    </div>
  );
}
