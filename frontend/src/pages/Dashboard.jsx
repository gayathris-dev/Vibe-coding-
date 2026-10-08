import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from '../config/departments';
import { getTickets } from '../services/ticketService';
import TicketTable from '../components/TicketTable';
import TicketAlertPanel from '../components/TicketAlertPanel';
import CreateTicketModal from '../components/modals/CreateTicketModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useRole } from '../context/RoleContext';
import { ROLE_HOME } from '../config/permissions';

const PAGE_SIZE = 25;

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useRole();
  const dashboardBase = ROLE_HOME[role] || '';

  const [tickets, setTickets] = useState([]);
  const [selectedAlertTicket, setSelectedAlertTicket] = useState(null);
  const [department, setDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadTickets = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError('');

      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      if (!isSilent) setError('Unable to load tickets.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (department !== 'All') {
      list = list.filter((ticket) => ticket.department === department);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ticket) =>
        (ticket.id && ticket.id.toLowerCase().includes(q)) ||
        (ticket.description && ticket.description.toLowerCase().includes(q)) ||
        (ticket.requestorId && ticket.requestorId.toLowerCase().includes(q)) ||
        (ticket.status && ticket.status.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tickets, department, searchQuery]);

  // Reset page when department or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [department, searchQuery]);

  const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTickets.slice(start, start + PAGE_SIZE);
  }, [filteredTickets, currentPage]);

  const handleAlertClick = (ticket) => {
    setSelectedAlertTicket(ticket);
  };

  const handleOpenTicket = (ticketId) => {
    setSelectedAlertTicket(null);
    navigate(`${dashboardBase}/tickets/${ticketId}`);
  };

  const handleTicketCreated = (newTicket) => {
    loadTickets(true);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Tickets ({filteredTickets.length.toLocaleString()} of {tickets.length.toLocaleString()} Total)</h1>
          <p>
            Review incoming IT support tickets and their AI match confidence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by ID, description, requestor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: '13px',
              minWidth: 220
            }}
          />

          <div className="department-filter" style={{ margin: 0 }}>
            <label htmlFor="department" style={{ display: 'none' }}>Department</label>
            <select
              id="department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="All">All Departments ({tickets.length.toLocaleString()})</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item} ({tickets.filter(t => t.department === item).length.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary btn-small"
            onClick={() => setCreateModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            + Create Ticket
          </button>
        </div>
      </div>

      {loading && <LoadingState label="Loading tickets…" />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={loadTickets}
        />
      )}

      {!loading && !error && (
        <>
          <TicketTable
            tickets={paginatedTickets}
            onAlertClick={handleAlertClick}
          />

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length.toLocaleString()} tickets
              </span>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-small"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 8px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-small"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TicketAlertPanel
        ticket={selectedAlertTicket}
        onClose={() => setSelectedAlertTicket(null)}
        onOpenTicket={handleOpenTicket}
      />

      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleTicketCreated}
      />
    </div>
  );
}