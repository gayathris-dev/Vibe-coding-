import { useState } from 'react';
import { hasPermission } from '../config/permissions';
import { useRole } from '../context/RoleContext';
import DashboardShell from '../components/DashboardShell';
import DashboardOverview from './DashboardOverview';
import Dashboard from './Dashboard';
import Insights from './Insights';
import KnowledgeBase from './KnowledgeBase';

const TAB_DEFS = [
  { key: 'Dashboard', permission: 'VIEW_DASHBOARD' },
  { key: 'Tickets', permission: 'VIEW_DASHBOARD' },
  { key: 'Insights', permission: 'VIEW_INSIGHTS' },
  { key: 'Knowledge Base', permission: 'VIEW_KNOWLEDGE_BASE' },
];

// The Tickets tab mounts the existing Dashboard.jsx unchanged — department
// filter, ticket table, amber alert panel, all four workflow actions.
export default function AnalystDashboard() {
  const { role } = useRole();
  const tabs = TAB_DEFS.filter((t) => hasPermission(role, t.permission)).map((t) => t.key);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <DashboardShell
      title="Analyst Dashboard"
      subtitle="Confidence-based ticket matching, review, and remediation."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'Dashboard' && <DashboardOverview />}
      {activeTab === 'Tickets' && <Dashboard />}
      {activeTab === 'Insights' && <Insights />}
      {activeTab === 'Knowledge Base' && <KnowledgeBase />}
    </DashboardShell>
  );
}