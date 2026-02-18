import './StatusBadge.css';

const LABELS = {
  not_started: 'not started',
  building: 'building',
  built: 'built',
  deprecated: 'deprecated',
};

export default function StatusBadge({ status, compact = false }) {
  return (
    <span className={`status-badge status-${status} ${compact ? 'compact' : ''}`}>
      {compact ? '' : LABELS[status] || status}
      {compact && <span className="status-dot" />}
    </span>
  );
}
