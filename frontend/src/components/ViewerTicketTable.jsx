import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useRole } from '../context/RoleContext';
import { ROLE_HOME } from '../config/permissions';

// Deliberately a separate, dedicated component rather than a mode of
// TicketTable.jsx — the Viewer spec calls for exactly three columns and
// no action buttons, different enough that reusing TicketTable would
// mean more conditional branching there than just having this.
export default function ViewerTicketTable({ tickets = [] }) {
  const navigate = useNavigate();
  const { role } = useRole();
  const dashboardBase = ROLE_HOME[role] || '';

  if (!tickets.length) {
    return <div className="table-empty">No tickets found.</div>;
  }

  return (
    <div className="ticket-table-wrapper">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="ticket-table__row"
              onClick={() => navigate(`${dashboardBase}/tickets/${ticket.id}`)}
            >
              <td data-label="Ticket ID"><strong>{ticket.id}</strong></td>
              <td data-label="Description">{ticket.description}</td>
              <td data-label="Status"><StatusBadge status={ticket.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}