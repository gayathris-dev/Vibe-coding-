import { useEffect, useState } from 'react';
import { getTickets } from '../services/ticketService';
import ViewerTicketTable from '../components/ViewerTicketTable';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import Insights from './Insights';
import KnowledgeBase from './KnowledgeBase';
import DashboardShell from '../components/DashboardShell';
import DashboardOverview from './DashboardOverview';
import { hasPermission } from '../config/permissions';
import { useRole } from '../context/RoleContext';

const TAB_DEFS = [
  { key: 'Dashboard', permission: 'VIEW_DASHBOARD' },
  { key: 'Tickets', permission: 'VIEW_DASHBOARD' },
  { key: 'Insights', permission: 'VIEW_INSIGHTS' },
  { key: 'Knowledge Base', permission: 'VIEW_KNOWLEDGE_BASE' },
];

function ViewerTicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getTickets()
      .then(setTickets)
      .catch(() => setError('Unable to load tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState label="Loading tickets…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return <ViewerTicketTable tickets={tickets} />;
}

export default function ViewerDashboard() {
  const { role } = useRole();
  const tabs = TAB_DEFS.filter((t) => hasPermission(role, t.permission)).map((t) => t.key);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <DashboardShell
      title="Viewer Dashboard"
      subtitle="Read-only access to tickets, insights, and knowledge base."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'Dashboard' && <DashboardOverview />}
      {activeTab === 'Tickets' && <ViewerTicketsTab />}
      {activeTab === 'Insights' && <Insights />}
      {activeTab === 'Knowledge Base' && <KnowledgeBase />}
    </DashboardShell>
  );
}