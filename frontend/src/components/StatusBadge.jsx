export default function StatusBadge({ status }) {
  const statusClass = status
    .toLowerCase()
    .replace(/_/g, '-');

  return (
    <span className={`status-badge status-badge--${statusClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}