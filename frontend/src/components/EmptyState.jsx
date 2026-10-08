export default function EmptyState({
  message = 'No data available.',
}) {
  return (
    <div className="state-block state-empty">
      {message}
    </div>
  );
}