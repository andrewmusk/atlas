import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateNode } from '../../api/atlas.js';
import './ProposalCard.css';

function formatValue(val) {
  if (Array.isArray(val)) return val.join('\n');
  if (val === null || val === undefined) return '(empty)';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

export default function ProposalCard({ proposal, nodeId }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending'); // pending | accepted | rejected
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    try {
      setError(null);
      await updateNode(nodeId, { payload: { [proposal.field]: proposal.new_value } });
      qc.invalidateQueries({ queryKey: ['node', nodeId] });
      setStatus('accepted');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = () => {
    setStatus('rejected');
  };

  return (
    <div className={`proposal-card proposal-card--${status}`}>
      <div className="proposal-header">
        <span className="proposal-field-name">{proposal.field}</span>
        <span className="proposal-badge">proposal</span>
      </div>

      {proposal.reasoning && (
        <div className="proposal-reasoning">{proposal.reasoning}</div>
      )}

      {proposal.old_value !== undefined && (
        <div className="proposal-section proposal-section--old">
          <span className="proposal-section-label">Current</span>
          <pre className="proposal-value">{formatValue(proposal.old_value)}</pre>
        </div>
      )}

      <div className="proposal-section proposal-section--new">
        <span className="proposal-section-label">Proposed</span>
        <pre className="proposal-value">{formatValue(proposal.new_value)}</pre>
      </div>

      {error && <div className="proposal-error">{error}</div>}

      {status === 'pending' && (
        <div className="proposal-actions">
          <button className="proposal-btn proposal-btn--accept" onClick={handleAccept}>
            Accept
          </button>
          <button className="proposal-btn proposal-btn--reject" onClick={handleReject}>
            Reject
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <div className="proposal-result proposal-result--accepted">Applied to node</div>
      )}
      {status === 'rejected' && (
        <div className="proposal-result proposal-result--rejected">Dismissed</div>
      )}
    </div>
  );
}
