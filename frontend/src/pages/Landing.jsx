import { useState } from 'react';
import { DEPARTMENTS } from '../config/departments';
import { createTicket } from '../services/ticketService';
import InteractiveDotField from '../components/InteractiveDotField';
import { useRef } from 'react';

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB, per spec

// Deliberately self-contained: ticket submission ends here. It does not
// navigate anywhere, does not know about /login, and does not pass any
// data to it. Login is a separate entry point for authorized staff, not
// a continuation of this flow.
export default function Landing() {
  const pageRef = useRef(null);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [requestorId, setRequestorId] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const isValid =
    department && requestorId.trim().length > 0 && description.trim().length > 0;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (file && file.size > MAX_ATTACHMENT_BYTES) {
      setAttachment(null);
      setAttachmentError('Attachment must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }

    setAttachmentError('');
    setAttachment(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const ticket = await createTicket({
        department,
        requestorId: requestorId.trim(),
        description: description.trim(),
        attachment,
      });

      setSubmittedTicket(ticket);
    } catch (err) {
      setSubmitError('Unable to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setSubmittedTicket(null);
    setDepartment(DEPARTMENTS[0]);
    setRequestorId('');
    setDescription('');
    setAttachment(null);
    setAttachmentError('');
  };

  return (
    <div ref={pageRef} className="auth-page">
      <InteractiveDotField containerRef={pageRef} />
      <div className="auth-card">
        <h1 className="auth-page__title">Dynamic Resolver</h1>
        <p className="auth-page__subtitle">Submit a support ticket to get started.</p>

        {submittedTicket ? (
          <div>
            <p className="action-message">
              Ticket <strong>{submittedTicket.id}</strong> submitted successfully.
            </p>
            <p className="ticket-form__note">
              Status: NEW. Support staff will see this ticket once it reaches their dashboard.
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleSubmitAnother}>
                Submit Another Ticket
              </button>
            </div>
          </div>
        ) : (
          <form className="ticket-form" onSubmit={handleSubmit}>
            <div className="ticket-form__field">
              <label htmlFor="ticket-department">Department</label>
              <select
                id="ticket-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                disabled={submitting}
              >
                {DEPARTMENTS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="ticket-form__field">
              <label htmlFor="ticket-requestor">Requestor ID</label>
              <input
                id="ticket-requestor"
                type="text"
                placeholder="Employee ID"
                value={requestorId}
                onChange={(event) => setRequestorId(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="ticket-form__field">
              <label htmlFor="ticket-description">Description</label>
              <textarea
                id="ticket-description"
                rows="5"
                placeholder="Describe the issue or request…"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="ticket-form__field">
              <label htmlFor="ticket-attachment">
                Attachment <span className="ticket-form__optional">(optional, max 2 MB)</span>
              </label>
              <input
                id="ticket-attachment"
                type="file"
                onChange={handleFileChange}
                disabled={submitting}
              />
              {attachment && (
                <span className="ticket-form__file-name">{attachment.name}</span>
              )}
              {attachmentError && (
                <span className="ticket-form__error">{attachmentError}</span>
              )}
            </div>

            <p className="ticket-form__note">
              Ticket ID and timestamp are generated automatically. A SHA-256
              hash of this ticket will be generated by the backend once
              connected.
            </p>

            {submitError && (
              <p className="action-message action-message--error">{submitError}</p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isValid || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}