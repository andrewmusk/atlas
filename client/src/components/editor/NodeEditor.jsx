import { useNode } from '../../hooks/useNode.js';
import ProjectEditor from './ProjectEditor.jsx';
import SystemEditor from './SystemEditor.jsx';
import SubsystemEditor from './SubsystemEditor.jsx';
import RequirementEditor from './RequirementEditor.jsx';
import './NodeEditor.css';

const EDITORS = {
  project: ProjectEditor,
  system: SystemEditor,
  subsystem: SubsystemEditor,
  requirement: RequirementEditor,
};

export default function NodeEditor({ nodeId }) {
  const { data: node, isLoading, error } = useNode(nodeId);

  if (isLoading) {
    return <div className="node-editor-loading">Loading...</div>;
  }

  if (error) {
    return <div className="node-editor-error">Error: {error.message}</div>;
  }

  if (!node) return null;

  const Editor = EDITORS[node.type] || ProjectEditor;
  return <Editor node={node} />;
}
