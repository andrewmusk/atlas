import { useState } from 'react';
import { useUpdateNode } from '../../hooks/useNode.js';
import StatusBadge from '../tree/StatusBadge.jsx';
import ChildrenSection from './ChildrenSection.jsx';
import './NodeEditor.css';

export default function SubsystemEditor({ node }) {
  const [fields, setFields] = useState({ ...node.payload });
  const { mutate: savePayload } = useUpdateNode(node.id);

  const handleBlur = () => savePayload({ payload: fields });

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-header-top">
          <span className="editor-node-type">{node.type}</span>
          <StatusBadge status={node.status} />
        </div>
        <div className="editor-node-name">{fields.name || node.id}</div>
      </div>

      <div className="editor-body">
        <div className="field-group">
          <label>Name</label>
          <input value={fields.name || ''} onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))} onBlur={handleBlur} />
        </div>

        <div className="field-group">
          <label>Abbreviation <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            value={fields.abbreviation || ''}
            onChange={(e) => setFields((f) => ({ ...f, abbreviation: e.target.value.toUpperCase() }))}
            onBlur={handleBlur}
            placeholder="e.g. HIER"
            style={{ fontWeight: 600, color: 'var(--accent)' }}
          />
        </div>

        <div className="field-group">
          <label>Purpose</label>
          <textarea value={fields.purpose || ''} onChange={(e) => setFields((f) => ({ ...f, purpose: e.target.value }))} onBlur={handleBlur} rows={4} />
        </div>

        <ChildrenSection parentId={node.id} childType="requirement" label="Requirements" />
      </div>
    </div>
  );
}
