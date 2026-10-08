export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}) {
  return (
    <div className="state-block state-error">
      <p>{message}</p>

      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          Retry
        </button>
      )}
    </div>
  );
}