import { useState } from 'react';
import { useCreateNode } from '../../hooks/useChildren.js';
import './AddNodeModal.css';

const TYPE_FIELDS = {
  project: ['name'],
  system: ['name', 'description', 'core_value'],
  subsystem: ['name', 'abbreviation', 'purpose'],
  requirement: ['statement', 'priority', 'type'],
  flow: ['name', 'description'],
};

const PLACEHOLDERS = {
  name: 'e.g. Atlas',
  description: 'e.g. A living, queryable representation of what a company is building',
  core_value: 'e.g. Agents and humans share a single source of truth for what is being built',
  abbreviation: 'e.g. HIER (uppercase, 2-6 chars)',
  purpose: 'e.g. Owns the creation and organization of the full node graph',
  statement: 'The system shall...',
  priority: '',
  type: '',
};

export default function AddNodeModal({ type, parentId, onClose, onCreated }) {
  const [fields, setFields] = useState({});
  const { mutateAsync, isPending, error } = useCreateNode();

  const fieldList = TYPE_FIELDS[type] || ['name'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...fields };
    if (fields.abbreviation) {
      payload.abbreviation = fields.abbreviation.toUpperCase();
    }

    const data = {
      type,
      parentId: parentId || undefined,
      payload,
      author: 'anonymous',
      authorType: 'human',
    };

    try {
      const node = await mutateAsync(data);
      onCreated?.(node);
      onClose();
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New {type}</span>
          {parentId && <span className="modal-parent">in {parentId}</span>}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {fieldList.map((field) => (
            <div className="field-group" key={field}>
              <label>{field}</label>
              {field === 'priority' ? (
                <select
                  value={fields[field] || ''}
                  onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                >
                  <option value="">Select priority</option>
                  <option value="Must">Must</option>
                  <option value="Should">Should</option>
                  <option value="Could">Could</option>
                </select>
              ) : field === 'type' ? (
                <select
                  value={fields[field] || ''}
                  onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                >
                  <option value="">Select type</option>
                  <option value="Functional">Functional</option>
                  <option value="Non-functional">Non-functional</option>
                  <option value="Constraint">Constraint</option>
                </select>
              ) : field === 'statement' || field === 'purpose' || field === 'description' || field === 'core_value' ? (
                <textarea
                  placeholder={PLACEHOLDERS[field] || ''}
                  value={fields[field] || ''}
                  onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  placeholder={PLACEHOLDERS[field] || ''}
                  value={fields[field] || ''}
                  onChange={(e) => setFields((f) => ({ ...f, [field]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {error && <div className="modal-error">{error.message}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Creating...' : `Create ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
