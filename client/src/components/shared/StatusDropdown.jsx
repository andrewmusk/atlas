import { VALID_TRANSITIONS, VALID_STATUSES } from '../../lib/statusMachine.js';
import './StatusDropdown.css';

export default function StatusDropdown({ currentStatus, onTransition, disabled }) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== currentStatus && allowed.includes(newStatus)) {
      onTransition(newStatus);
    }
  };

  return (
    <select
      className="status-dropdown"
      value={currentStatus}
      onChange={handleChange}
      disabled={disabled}
      data-status={currentStatus}
    >
      <option value={currentStatus}>{currentStatus}</option>
      {VALID_STATUSES.filter((s) => s !== currentStatus).map((s) => (
        <option key={s} value={s} disabled={!allowed.includes(s)}>
          {s}{allowed.includes(s) ? '' : ' (invalid)'}
        </option>
      ))}
    </select>
  );
}
