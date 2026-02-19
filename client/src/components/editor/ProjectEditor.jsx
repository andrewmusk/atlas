import { useState } from 'react';
import { useUpdateNode, useDeleteNode } from '../../hooks/useNode.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import StatusBadge from '../tree/StatusBadge.jsx';
import ConfirmModal from '../shared/ConfirmModal.jsx';
import ChildrenSection from './ChildrenSection.jsx';
import './NodeEditor.css';

export default function ProjectEditor({ node }) {
  const [fields, setFields] = useState({ ...node.payload });
  const [showDelete, setShowDelete] = useState(false);
  const { mutate: savePayload } = useUpdateNode(node.id);
  const { mutate: doDelete } = useDeleteNode(node.id);
  const selectNode = useAtlasStore((s) => s.selectNode);

  const save = (updated) => savePayload({ payload: updated });
  const handleBlur = () => save(fields);

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

        <ChildrenSection parentId={node.id} childType="system" label="Systems" />

        <div className="editor-actions">
          <button className="btn btn-danger" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
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
