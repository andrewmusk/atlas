import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChildren } from '../../api/atlas.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import StatusBadge from './StatusBadge.jsx';
import AddNodeModal from './AddNodeModal.jsx';
import './TreeNode.css';

const CHILD_TYPES = {
  project: 'system',
  system: 'subsystem',
  subsystem: 'requirement',
  requirement: null,
  flow: null,
};

const TYPE_ICONS = {
  project: '◈',
  system: '◆',
  subsystem: '◇',
  capability: '○',
  requirement: '·',
  flow: '→',
};

export default function TreeNode({ node, depth }) {
  const { selectedNodeId, selectNode, expandedNodes, toggleExpand } = useAtlasStore();
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodes.has(node.id);
  const childType = CHILD_TYPES[node.type];
  const hasChildren = childType !== null;

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['children', node.id],
    queryFn: () => getChildren(node.id),
    enabled: isExpanded,
  });

  const handleClick = (e) => {
    e.stopPropagation();
    selectNode(node.id);
    if (hasChildren && !isExpanded) toggleExpand(node.id);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleExpand(node.id);
  };

  const displayName =
    node.payload?.name ||
    node.payload?.statement?.substring(0, 50) ||
    node.payload?.description?.substring(0, 50) ||
    node.id;

  return (
    <div className="tree-node-wrapper">
      <div
        className={`tree-node-row ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button className="tree-chevron" onClick={handleToggle}>
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-chevron-placeholder" />
        )}

        <span className="tree-icon" title={node.type}>
          {TYPE_ICONS[node.type] || '·'}
        </span>

        <span className="tree-label" title={displayName}>
          {displayName}
        </span>

        <span className="tree-node-id">{node.id}</span>

        <StatusBadge status={node.status} compact />

        {childType && (
          <button
            className="tree-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowAdd(true);
            }}
            title={`Add ${childType}`}
          >
            +
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="tree-children">
          {isLoading && (
            <div className="tree-children-loading" style={{ paddingLeft: `${28 + depth * 16}px` }}>
              …
            </div>
          )}
          {children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddNodeModal
          type={childType}
          parentId={node.id}
          onClose={() => setShowAdd(false)}
          onCreated={(newNode) => {
            qc.invalidateQueries({ queryKey: ['children', node.id] });
            if (!isExpanded) toggleExpand(node.id);
            selectNode(newNode.id);
          }}
        />
      )}
    </div>
  );
}
