import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../services/ticketService';
import { useRole } from '../context/RoleContext';
import { hasPermission, ROLE_HOME } from '../config/permissions';
import { computeTicketMetrics } from '../utils/ticketMetrics';
import KpiCards from '../components/KpiCards';
import TicketTable from '../components/TicketTable';
import ViewerTicketTable from '../components/ViewerTicketTable';
import TicketAlertPanel from '../components/TicketAlertPanel';
import CreateTicketModal from '../components/modals/CreateTicketModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const RECENT_LIMIT = 6;

export default function DashboardOverview() {
  const { role } = useRole();
  const navigate = useNavigate();
  const canTriage = hasPermission(role, 'PERFORM_TICKET_ACTIONS');
  const dashboardBase = ROLE_HOME[role] || '';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertTicket, setAlertTicket] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [latestToken, setLatestToken] = useState(null);

  const load = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    getTickets()
      .then((data) => {
        setTickets(data);
        if (data.length > 0 && !latestToken) {
          setLatestToken(data[0]);
        }
      })
      .catch(() => {
        if (!isSilent) setError('Unable to load tickets.');
      })
      .finally(() => {
        if (!isSilent) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // Live polling every 4 seconds to dynamically reflect newly ingested tickets & KPI updates
    const timer = setInterval(() => {
      load(true);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleTicketCreated = (newTicket) => {
    setLatestToken(newTicket);
    load(true);
  };

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  const metrics = computeTicketMetrics(tickets);
  const recent = [...tickets].slice(0, RECENT_LIMIT);

  return (
    <>
      <div className="motion-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Operational Overview</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Real-time telemetry, AI remediation health, and ticket token status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {latestToken && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0, 135, 90, 0.15)',
              border: '1px solid rgba(0, 135, 90, 0.4)',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '12px'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>Live Token:</span>
              <strong style={{ color: '#6ee7b7', fontFamily: 'monospace' }}>{latestToken.id}</strong>
            </div>
          )}
          <button
            className="btn btn-primary btn-small"
            onClick={() => setCreateModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            + Create Ticket
          </button>
        </div>
      </div>

      <div className="motion-fade-up">
        <KpiCards
          items={[
            { label: 'New Tickets', value: metrics.newCount, tone: 'warn' },
            { label: 'Self-Healed', value: metrics.selfHealedCount, tone: 'success' },
            { label: 'Awaiting Analyst Action', value: metrics.awaitingAnalystAction, tone: 'info' },
            { label: 'Escalated', value: metrics.escalatedCount, tone: 'danger' },
          ]}
        />
      </div>

      <div className="detail-card motion-fade-up motion-delay-2" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Recent Tickets & Live Tokens</h2>
            <p className="ticket-form__note" style={{ margin: '4px 0 0' }}>
              Showing the {Math.min(RECENT_LIMIT, tickets.length)} most recent tokens.
              See the Tickets tab for full 6,000 repository browsing.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => load(false)}
            title="Refresh ticket telemetry"
          >
            ↻ Refresh
          </button>
        </div>

        {canTriage ? (
          <TicketTable tickets={recent} onAlertClick={setAlertTicket} />
        ) : (
          <ViewerTicketTable tickets={recent} />
        )}
      </div>

      {canTriage && (
        <TicketAlertPanel
          ticket={alertTicket}
          onClose={() => setAlertTicket(null)}
          onOpenTicket={(id) => {
            setAlertTicket(null);
            navigate(`${dashboardBase}/tickets/${id}`);
          }}
        />
      )}

      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleTicketCreated}
      />
    </>
  );
}