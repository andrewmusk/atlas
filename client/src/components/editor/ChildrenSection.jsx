import { useQuery } from '@tanstack/react-query';
import { getChildren } from '../../api/atlas.js';
import useAtlasStore from '../../store/useAtlasStore.js';
import './ChildrenSection.css';

const STATUS_DOT = {
  not_started: '#555',
  building: '#d4a017',
  built: '#3a9b5c',
  deprecated: '#8b3a3a',
};

export default function ChildrenSection({ parentId, childType, label }) {
  const selectNode = useAtlasStore((s) => s.selectNode);
  const { setExpanded } = useAtlasStore();

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['children', parentId],
    queryFn: () => getChildren(parentId),
    enabled: !!parentId,
  });

  if (isLoading) return null;
  if (children.length === 0) return (
    <div className="children-section">
      <div className="children-section-label">{label}</div>
      <div className="children-empty">No {childType}s yet</div>
    </div>
  );

  const handleClick = (child) => {
    selectNode(child.id);
    // Expand the parent in the tree so the child is visible
    setExpanded(parentId, true);
  };

  return (
    <div className="children-section">
      <div className="children-section-label">
        {label} <span className="children-count">{children.length}</span>
      </div>
      <div className="children-list">
        {children.map((child) => {
          const name =
            child.payload?.name ||
            child.payload?.description ||
            child.payload?.statement?.substring(0, 60) ||
            child.id;

          return (
            <button
              key={child.id}
              className="child-row"
              onClick={() => handleClick(child)}
            >
              <span
                className="child-status-dot"
                style={{ background: STATUS_DOT[child.status] || '#555' }}
              />
              <span className="child-id">{child.id}</span>
              <span className="child-name">{name}</span>
              <span className="child-arrow">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
