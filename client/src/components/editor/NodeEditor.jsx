import { useState, useEffect } from 'react';
import { useNode } from '../../hooks/useNode.js';
import ProjectEditor from './ProjectEditor.jsx';
import SystemEditor from './SystemEditor.jsx';
import SubsystemEditor from './SubsystemEditor.jsx';
import CapabilityEditor from './CapabilityEditor.jsx';
import RequirementEditor from './RequirementEditor.jsx';
import EditorChatsTab from './EditorChatsTab.jsx';
import EditorChangelogTab from './EditorChangelogTab.jsx';
import './NodeEditor.css';

const EDITORS = {
  project: ProjectEditor,
  system: SystemEditor,
  subsystem: SubsystemEditor,
  capability: CapabilityEditor,
  requirement: RequirementEditor,
};

const TABS = [
  { key: 'edit', label: 'Edit' },
  { key: 'chats', label: 'Chats' },
  { key: 'changelog', label: 'Changelog' },
];

export default function NodeEditor({ nodeId }) {
  const { data: node, isLoading, error } = useNode(nodeId);
  const [tab, setTab] = useState('edit');

  useEffect(() => { setTab('edit'); }, [nodeId]);

  if (isLoading) {
    return <div className="node-editor-loading">Loading...</div>;
  }

  if (error) {
    return <div className="node-editor-error">Error: {error.message}</div>;
  }

  if (!node) return null;

  const Editor = EDITORS[node.type] || ProjectEditor;

  return (
    <div className="node-editor-root">
      <div className="node-editor-tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`node-editor-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'edit' && <Editor key={node.updatedAt} node={node} />}
      {tab === 'chats' && <EditorChatsTab node={node} />}
      {tab === 'changelog' && <EditorChangelogTab node={node} />}
    </div>
  );
}
