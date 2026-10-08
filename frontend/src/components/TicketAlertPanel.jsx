import { useEffect } from 'react';

export default function TicketAlertPanel({ ticket, onClose, onOpenTicket }) {
  useEffect(() => {
    if (!ticket) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ticket, onClose]);

  if (!ticket) {
    return null;
  }

  return (
    <div className="alert-panel-backdrop" onClick={onClose}>
      <div
        className="alert-panel"
        role="dialog"
        aria-label={`New ticket alert for ${ticket.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="alert-panel__header">
          <div>
            <span className="alert-panel__eyebrow">New Ticket</span>
            <h2>{ticket.id}</h2>
          </div>
          <button
            className="alert-panel__close"
            aria-label="Close alert panel"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="alert-panel__score">
          <span>Match confidence</span>
          <strong>{ticket.score}%</strong>
        </div>

        <div className="alert-panel__section">
          <h3>Department</h3>
          <p>{ticket.department}</p>
        </div>

        <div className="alert-panel__section">
          <h3>Description</h3>
          <p>{ticket.description}</p>
        </div>

        {ticket.article && (
          <div className="alert-panel__section">
            <h3>Matched Article</h3>
            <h4>{ticket.article.title}</h4>
          </div>
        )}

        <div className="alert-panel__actions">
          <button
            className="btn btn-primary btn-small"
            onClick={() => onOpenTicket(ticket.id)}
          >
            Open Ticket Detail
          </button>
          <button className="btn btn-secondary btn-small" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}