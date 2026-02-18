import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../../api/atlas.js';
import TreeNode from '../tree/TreeNode.jsx';
import AddNodeModal from '../tree/AddNodeModal.jsx';
import './TreePanel.css';

export default function TreePanel() {
  const [showAddProject, setShowAddProject] = useState(false);
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  return (
    <aside className="tree-panel">
      <div className="panel-header">
        <span className="panel-title">Atlas</span>
        <button className="btn btn-ghost btn-xs" onClick={() => setShowAddProject(true)} title="New project">
          + Project
        </button>
      </div>

      <div className="tree-scroll">
        {isLoading && <div className="tree-loading">Loading...</div>}
        {error && <div className="tree-error">Error loading projects</div>}
        {!isLoading && projects.length === 0 && (
          <div className="tree-empty">No projects yet</div>
        )}
        {projects.map((p) => (
          <TreeNode key={p.id} node={p} depth={0} />
        ))}
      </div>

      {showAddProject && (
        <AddNodeModal
          type="project"
          parentId={null}
          onClose={() => setShowAddProject(false)}
        />
      )}
    </aside>
  );
}
