import { useState } from 'react';
import { useUpdateNode, useDeleteNode } from '../../hooks/useNode.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import StatusBadge from '../tree/StatusBadge.jsx';
import ChangelogPanel from '../shared/ChangelogPanel.jsx';
import ConfirmModal from '../shared/ConfirmModal.jsx';
import './NodeEditor.css';
import './ProjectEditor.css';

export default function ProjectEditor({ node }) {
  const [fields, setFields] = useState({ ...node.payload });
  const [showDelete, setShowDelete] = useState(false);
  const { mutate: savePayload } = useUpdateNode(node.id);
  const { mutate: doDelete } = useDeleteNode(node.id);
  const selectNode = useAtlasStore((s) => s.selectNode);

  const save = (updated) => savePayload({ payload: updated });

  const handleBlur = () => save(fields);

  const constraints = Array.isArray(fields.constraints) ? fields.constraints : [];

  const updateConstraint = (i, val) => {
    const next = constraints.map((c, idx) => idx === i ? val : c);
    setFields((f) => ({ ...f, constraints: next }));
  };

  const removeConstraint = (i) => {
    const next = constraints.filter((_, idx) => idx !== i);
    const updated = { ...fields, constraints: next };
    setFields(updated);
    save(updated);
  };

  const addConstraint = () => {
    const next = [...constraints, ''];
    setFields((f) => ({ ...f, constraints: next }));
  };

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
          <input
            value={fields.name || ''}
            onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
            onBlur={handleBlur}
          />
        </div>

        <div className="field-group">
          <label>Mission</label>
          <textarea
            value={fields.mission || ''}
            onChange={(e) => setFields((f) => ({ ...f, mission: e.target.value }))}
            onBlur={handleBlur}
            rows={3}
          />
        </div>

        <div className="field-group">
          <label>Constraints</label>
          <div className="constraint-list">
            {constraints.map((c, i) => (
              <div key={i} className="constraint-row">
                <input
                  value={c}
                  onChange={(e) => updateConstraint(i, e.target.value)}
                  onBlur={handleBlur}
                  placeholder="The system must..."
                />
                <button
                  className="constraint-remove"
                  onClick={() => removeConstraint(i)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            <button className="btn btn-ghost constraint-add" onClick={addConstraint}>
              + Add constraint
            </button>
          </div>
        </div>

        <div className="editor-actions">
          <button className="btn btn-danger" onClick={() => setShowDelete(true)}>Delete</button>
        </div>

        <ChangelogPanel entries={node.changelogEntries || []} />
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete project"
          message={`Delete "${fields.name || node.id}"? This cannot be undone. Delete all children first.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setShowDelete(false)}
          onConfirm={() => {
            doDelete();
            selectNode(null);
            setShowDelete(false);
          }}
        />
      )}
    </div>
  );
}
