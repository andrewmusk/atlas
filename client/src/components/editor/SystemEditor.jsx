import { useState } from 'react';
import { useUpdateNode } from '../../hooks/useNode.js';
import StatusBadge from '../tree/StatusBadge.jsx';
import ChildrenSection from './ChildrenSection.jsx';
import './NodeEditor.css';
import './SystemEditor.css';

function ListEditor({ items = [], onChange, fields, labels }) {
  const add = () => {
    const empty = {};
    fields.forEach((f) => { empty[f] = ''; });
    onChange([...items, empty]);
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  const update = (i, key, value) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
    onChange(next);
  };

  return (
    <div>
      {items.map((item, i) => (
        <div className="list-item" key={i}>
          <div className="list-item-fields">
            <div className="list-item-row">
              {fields.map((f) => (
                <div key={f}>
                  <label>{labels[f] || f}</label>
                  {f === 'reason' || f === 'constraint' || f === 'rationale' ? (
                    <textarea
                      value={item[f] || ''}
                      onChange={(e) => update(i, f, e.target.value)}
                      rows={2}
                    />
                  ) : f === 'outcome' ? (
                    <select
                      className="outcome-select"
                      value={item[f] || 'pending'}
                      onChange={(e) => update(i, f, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="good">Good</option>
                      <option value="revisit">Revisit</option>
                    </select>
                  ) : (
                    <input
                      value={item[f] || ''}
                      onChange={(e) => update(i, f, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button className="list-item-remove" onClick={() => remove(i)} title="Remove">×</button>
        </div>
      ))}
      <button className="list-add-btn" onClick={add}>+ Add</button>
    </div>
  );
}

function Collapsible({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="editor-section">
      <button className="collapsible-toggle" onClick={() => setOpen(!open)}>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}>▶</span>
        {title}
        {count != null && <span className="editor-section-count">({count})</span>}
      </button>
      {open && children}
    </div>
  );
}

const CONSTRAINT_FIELDS = ['type', 'constraint', 'reason'];
const CONSTRAINT_LABELS = { type: 'Type', constraint: 'Constraint', reason: 'Reason' };

const DECISION_FIELDS = ['decision', 'rationale', 'outcome'];
const DECISION_LABELS = { decision: 'Decision', rationale: 'Rationale', outcome: 'Outcome' };

const SCOPE_FIELDS = ['item', 'reason'];
const SCOPE_LABELS = { item: 'Item', reason: 'Reason' };

const RESEARCH_FIELDS = [
  { key: 'stack', label: 'Stack' },
  { key: 'features', label: 'Features' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'pitfalls', label: 'Pitfalls' },
  { key: 'summary', label: 'Summary' },
];

export default function SystemEditor({ node }) {
  const [fields, setFields] = useState({ ...node.payload });
  const { mutate: savePayload } = useUpdateNode(node.id);

  const save = (updated) => savePayload({ payload: updated });
  const handleBlur = () => save(fields);

  const setField = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  const setListField = (key, value) => {
    const next = { ...fields, [key]: value };
    setFields(next);
    save(next);
  };

  const setResearch = (key, value) => {
    const research = { ...(fields.research || {}), [key]: value };
    setFields((f) => ({ ...f, research }));
  };
  const saveResearch = () => save(fields);

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
        {/* Identity */}
        <div className="editor-section">
          <div className="field-group">
            <label>Name</label>
            <input value={fields.name || ''} onChange={(e) => setField('name', e.target.value)} onBlur={handleBlur} />
          </div>
          <div className="field-group">
            <label>Description</label>
            <textarea value={fields.description || ''} onChange={(e) => setField('description', e.target.value)} onBlur={handleBlur} rows={3} />
          </div>
        </div>

        {/* Core */}
        <div className="editor-section">
          <div className="editor-section-header">
            <span className="editor-section-title">Core</span>
          </div>
          <div className="field-group">
            <label>Core Value</label>
            <textarea value={fields.core_value || ''} onChange={(e) => setField('core_value', e.target.value)} onBlur={handleBlur} rows={2} />
          </div>
          <div className="field-group">
            <label>Who It's For</label>
            <textarea value={fields.who_its_for || ''} onChange={(e) => setField('who_its_for', e.target.value)} onBlur={handleBlur} rows={2} />
          </div>
          <div className="field-group">
            <label>Problem</label>
            <textarea value={fields.problem || ''} onChange={(e) => setField('problem', e.target.value)} onBlur={handleBlur} rows={2} />
          </div>
          <div className="field-group">
            <label>What Done Looks Like</label>
            <textarea value={fields.what_done_looks_like || ''} onChange={(e) => setField('what_done_looks_like', e.target.value)} onBlur={handleBlur} rows={2} />
          </div>
        </div>

        {/* Context */}
        <div className="editor-section">
          <div className="editor-section-header">
            <span className="editor-section-title">Context</span>
          </div>
          <div className="field-group">
            <label>Background</label>
            <textarea value={fields.context || ''} onChange={(e) => setField('context', e.target.value)} onBlur={handleBlur} rows={4} />
          </div>
        </div>

        {/* Constraints */}
        <Collapsible title="Constraints" count={(fields.constraints || []).length} defaultOpen={(fields.constraints || []).length > 0}>
          <ListEditor
            items={fields.constraints || []}
            onChange={(v) => setListField('constraints', v)}
            fields={CONSTRAINT_FIELDS}
            labels={CONSTRAINT_LABELS}
          />
        </Collapsible>

        {/* Decisions */}
        <Collapsible title="Decisions" count={(fields.decisions || []).length} defaultOpen={(fields.decisions || []).length > 0}>
          <ListEditor
            items={fields.decisions || []}
            onChange={(v) => setListField('decisions', v)}
            fields={DECISION_FIELDS}
            labels={DECISION_LABELS}
          />
        </Collapsible>

        {/* Out of Scope */}
        <Collapsible title="Out of Scope" count={(fields.out_of_scope || []).length} defaultOpen={(fields.out_of_scope || []).length > 0}>
          <ListEditor
            items={fields.out_of_scope || []}
            onChange={(v) => setListField('out_of_scope', v)}
            fields={SCOPE_FIELDS}
            labels={SCOPE_LABELS}
          />
        </Collapsible>

        {/* Research */}
        <Collapsible title="Research" count={fields.research ? Object.keys(fields.research).filter((k) => fields.research[k]).length : 0}>
          {RESEARCH_FIELDS.map(({ key, label }) => (
            <div className="research-field" key={key}>
              <label>{label}</label>
              <textarea
                value={(fields.research || {})[key] || ''}
                onChange={(e) => setResearch(key, e.target.value)}
                onBlur={saveResearch}
                rows={6}
              />
            </div>
          ))}
        </Collapsible>

        {/* Subsystems */}
        <ChildrenSection parentId={node.id} childType="subsystem" label="Subsystems" />
      </div>
    </div>
  );
}
