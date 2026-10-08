import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ConfidenceBar from './ConfidenceBar';
import { getWorkflowStage } from '../utils/workflow';
import { useRole } from '../context/RoleContext';
import { hasPermission, ROLE_HOME } from '../config/permissions';

export default function TicketTable({ tickets = [], onAlertClick }) {
  const navigate = useNavigate();
  const { role } = useRole();
  const canTriage = hasPermission(role, 'PERFORM_TICKET_ACTIONS');
  const dashboardBase = ROLE_HOME[role] || '';

  if (!tickets.length) {
    return <div className="table-empty">No tickets found for this department.</div>;
  }

  const goToTicket = (ticket) => navigate(`${dashboardBase}/tickets/${ticket.id}`);

  const handleAction = (event, ticket) => {
    event.stopPropagation();
    goToTicket(ticket);
  };

  return (
    <div className="ticket-table-wrapper">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Description</th>
            <th>Match Confidence</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => {
            const hasScore = ticket.score !== null && ticket.score !== undefined;
            const stage = hasScore ? getWorkflowStage(ticket.score) : null;

            return (
              <tr
                key={ticket.id}
                className="ticket-table__row"
                onClick={() => goToTicket(ticket)}
              >
                <td data-label="Ticket ID"><strong>{ticket.id}</strong></td>

                <td data-label="Description">
                  <div className="ticket-description">
                    {ticket.status === 'NEW' && (
                      <button
                        className="ticket-description__indicator"
                        title="Open new ticket alert"
                        aria-label={`Open alert for ${ticket.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onAlertClick(ticket);
                        }}
                      />
                    )}
                    <span>{ticket.description}</span>
                  </div>
                </td>

                <td data-label="Match Confidence">
                  {hasScore ? (
                    <ConfidenceBar score={ticket.score} />
                  ) : (
                    <span className="ticket-table__pending">Pending match</span>
                  )}
                </td>

                <td data-label="Status">
                  <StatusBadge status={ticket.status} />
                </td>

                <td data-label="Actions">
                  {!hasScore && (
                    <span className="ticket-table__pending">Awaiting AI match</span>
                  )}

                  {hasScore && !canTriage && (
                    <span className="ticket-table__view-only">View only</span>
                  )}

                  {hasScore && canTriage && (
                    <div className="ticket-actions">
                      {stage === 'SELF_HEAL' && (
                        ticket.status === 'SELF_HEALED' || ticket.status === 'RESOLVED' ? (
                          <button className="btn btn-secondary btn-small" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            Self-Healed ✓
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-small" onClick={(e) => handleAction(e, ticket)}>
                            Self-Heal
                          </button>
                        )
                      )}
                      {stage === 'OVERRIDE' && (
                        ticket.status === 'OVERRIDDEN' ? (
                          <button className="btn btn-secondary btn-small" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            Overridden ✓
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-small" onClick={(e) => handleAction(e, ticket)}>
                            Override
                          </button>
                        )
                      )}
                      {stage === 'ASK_MORE' && (
                        <button className="btn btn-secondary btn-small" onClick={(e) => handleAction(e, ticket)}>
                          Ask More
                        </button>
                      )}
                      {stage === 'ESCALATE' && (
                        ticket.status === 'ESCALATED' ? (
                          <button className="btn btn-secondary btn-small" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            Escalated
                          </button>
                        ) : (
                          <button className="btn btn-danger btn-small" onClick={(e) => handleAction(e, ticket)}>
                            Escalate
                          </button>
                        )
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}