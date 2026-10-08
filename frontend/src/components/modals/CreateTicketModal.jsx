import { useState } from 'react';
import { DEPARTMENTS } from '../../config/departments';
import { createTicket } from '../../services/ticketService';

export default function CreateTicketModal({ isOpen, onClose, onCreated }) {
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [requestorId, setRequestorId] = useState('EMP-2045');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !requestorId.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      const ticket = await createTicket({
        department,
        requestorId: requestorId.trim(),
        description: description.trim(),
      });
      setCreatedResult(ticket);
      if (onCreated) onCreated(ticket);
    } catch (err) {
      setError('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedResult(null);
    setDescription('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 540 }}>
        <h2>Create Support Ticket</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Ingest a new ticket directly. It will be tokenized, hashed with SHA-256, and scored by the AI matcher in real-time.
        </p>

        {createdResult ? (
          <div>
            <div style={{
              background: 'rgba(0, 135, 90, 0.12)',
              border: '1px solid #00875a',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <strong style={{ color: '#34d399', fontSize: 15 }}>Ticket Generated Successfully!</strong>
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>Live Token ID:</strong> <code style={{ color: '#6ee7b7', background: '#0b1120', padding: '2px 8px', borderRadius: 4 }}>{createdResult.id}</code>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                Department: <strong>{createdResult.department}</strong> | Status: <strong>{createdResult.status}</strong>
              </div>
              {createdResult.score !== null && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Initial Match Score: <strong>{createdResult.score}%</strong>
                </div>
              )}
            </div>
            <div className="modal__actions">
              <button className="btn btn-primary" onClick={handleReset}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="ticket-form__field" style={{ marginBottom: 12 }}>
              <label htmlFor="modal-dept">Department</label>
              <select
                id="modal-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={submitting}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="ticket-form__field" style={{ marginBottom: 12 }}>
              <label htmlFor="modal-requestor">Requestor ID</label>
              <input
                id="modal-requestor"
                type="text"
                value={requestorId}
                onChange={(e) => setRequestorId(e.target.value)}
                placeholder="e.g. EMP-2045"
                disabled={submitting}
                required
              />
            </div>

            <div className="ticket-form__field" style={{ marginBottom: 16 }}>
              <label htmlFor="modal-desc">Issue Description</label>
              <textarea
                id="modal-desc"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Application server connection pool exhausted, HTTP 500 error on checkout service..."
                disabled={submitting}
                required
              />
            </div>

            {error && (
              <p className="action-message action-message--error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <div className="modal__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !description.trim()}
              >
                {submitting ? 'Generating Token…' : '+ Ingest Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
