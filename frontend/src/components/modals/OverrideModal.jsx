export default function OverrideModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Analyst Override</h2>

        <p>
          Enter a short note explaining why the suggested
          knowledge article should be overridden.
        </p>

        <textarea
          className="modal__textarea"
          placeholder="Enter analyst note…"
          rows="4"
          disabled={loading}
        />

        <div className="modal__actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Confirm Override'}
          </button>
        </div>
      </div>
    </div>
  );
}