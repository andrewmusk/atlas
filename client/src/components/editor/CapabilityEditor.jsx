import { useState } from 'react';
import { useUpdateNode, useUpdateStatus } from '../../hooks/useNode.js';
import StatusDropdown from '../shared/StatusDropdown.jsx';
import ChangelogPanel from '../shared/ChangelogPanel.jsx';
import './NodeEditor.css';

export default function CapabilityEditor({ node }) {
  const [fields, setFields] = useState({ ...node.payload });
  const { mutate: savePayload } = useUpdateNode(node.id);
  const { mutate: saveStatus } = useUpdateStatus(node.id);

  const handleBlur = () => savePayload({ payload: fields });

  const displayName = fields.description || node.id;

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-header-top">
          <span className="editor-node-id">{node.id}</span>
          <span className="editor-node-type">{node.type}</span>
          <StatusDropdown
            currentStatus={node.status}
            onTransition={(s) => saveStatus({ status: s, author: 'user', authorType: 'human' })}
          />
        </div>
        <div className="editor-node-name" title={displayName}>
          {displayName.length > 80 ? displayName.substring(0, 80) + '…' : displayName}
        </div>
      </div>

      <div className="editor-body">
        <div className="field-group">
          <label>Description</label>
          <textarea value={fields.description || ''} onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))} onBlur={handleBlur} rows={3} />
        </div>

        <div className="field-group">
          <label>Notes</label>
          <textarea value={fields.notes || ''} onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))} onBlur={handleBlur} rows={3} />
        </div>

        <ChangelogPanel entries={node.changelogEntries || []} />
      </div>
    </div>
  );
}
