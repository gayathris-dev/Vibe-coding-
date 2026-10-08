export default function SelfHealModal({
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
        <h2>Self-Heal</h2>

        <p>
          This ticket has a 100% confidence match and is
          eligible for the approved self-healing action.
        </p>

        <div className="self-heal-info">
          <strong>Script</strong>
          <code>/opt/selfheal/restart_application_service.sh</code>
        </div>

        <div className="self-heal-info">
          <strong>Execution</strong>
          <span>
            Whitelisted self-healing script
          </span>
        </div>

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
            {loading ? 'Running…' : 'Run now'}
          </button>
        </div>

        {loading && (
          <div className="execution-log">
            <strong>Execution Log</strong>

            <pre>
              Starting approved self-healing script...
              {'\n'}Validating script...
              {'\n'}Executing remediation...
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}