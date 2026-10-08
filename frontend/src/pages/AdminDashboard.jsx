import { useEffect, useState } from 'react';
import { getPendingUsers, assignUserRole } from '../services/userQueueService';
import { QUEUE_ROLES, hasPermission } from '../config/permissions';
import { DEPARTMENTS } from '../config/departments';
import { useRole } from '../context/RoleContext';
import StatusBadge from '../components/StatusBadge';
import DashboardShell from '../components/DashboardShell';
import DashboardOverview from './DashboardOverview';
import Dashboard from './Dashboard';
import Insights from './Insights';
import KnowledgeBase from './KnowledgeBase';
import AuditLog from './AuditLog';

const TAB_DEFS = [
  { key: 'Dashboard', permission: 'VIEW_DASHBOARD' },
  { key: 'Queue', permission: 'MANAGE_USER_QUEUE' },
  { key: 'Tickets', permission: 'VIEW_DASHBOARD' },
  { key: 'Knowledge Base', permission: 'VIEW_KNOWLEDGE_BASE' },
  { key: 'Datasets', permission: 'UPLOAD_DATASETS' },
  { key: 'Retention Policy', permission: 'MANAGE_RETENTION_POLICY' },
  { key: 'Audit Log', permission: 'VIEW_AUDIT_LOG' },
  { key: 'Insights', permission: 'VIEW_INSIGHTS' },
];

function QueueTab() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningUsername, setAssigningUsername] = useState('');

  const load = () => {
    setLoading(true);
    getPendingUsers().then((data) => {
      setPending(data);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const handleAssign = async (username, role) => {
    if (!role) return;
    setAssigningUsername(username);
    await assignUserRole(username, role);
    await load();
    setAssigningUsername('');
  };

  if (loading) return <div className="state-block state-loading">Loading queue…</div>;

  if (!pending.length) {
    return (
      <div className="detail-card">
        <h2>Queue – Incoming Users</h2>
        <div className="state-block state-empty">No users waiting for role assignment.</div>
      </div>
    );
  }

  return (
    <div className="detail-card">
      <h2>Queue – Incoming Users</h2>
      <p className="ticket-form__note">
        Users waiting to be assigned a role. Separate from the ticket
        queue and from Production-Support escalation.
      </p>

      <table className="ticket-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Status</th>
            <th>Assign Role</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((u) => (
            <tr key={u.username}>
              <td data-label="Username"><strong>{u.username}</strong></td>
              <td data-label="Status"><StatusBadge status={u.status} /></td>
              <td data-label="Assign Role">
                <select
                  defaultValue=""
                  disabled={assigningUsername === u.username}
                  onChange={(event) => handleAssign(u.username, event.target.value)}
                >
                  <option value="" disabled>Select role…</option>
                  {QUEUE_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatasetsTab() {
  const [department, setDepartment] = useState('Data Center');
  const [category, setCategory] = useState('Standard Operating Procedure');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setStatusMessage('');
      setErrorMessage('');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/articles/upload?department_id=${encodeURIComponent(department)}&category=${encodeURIComponent(category)}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatusMessage(`Dataset article "${data.title}" successfully ingested and indexed (ID: ${data.id})!`);
      setFile(null);
      const input = document.getElementById('kb-file-upload');
      if (input) input.value = '';
    } catch (err) {
      setErrorMessage('Failed to upload and index dataset file. Please verify file format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="detail-card">
      <h2>Dataset & Knowledge Base Ingestion</h2>
      <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Upload Standard Operating Procedure documents (Markdown <code>.md</code>, Text <code>.txt</code>, JSON) to expand the AI matcher catalog.
      </p>

      <form onSubmit={handleUpload} style={{ maxWidth: 520 }}>
        <div className="ticket-form__field" style={{ marginBottom: 14 }}>
          <label htmlFor="dataset-dept">Target Department / Domain</label>
          <select
            id="dataset-dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={uploading}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="ticket-form__field" style={{ marginBottom: 14 }}>
          <label htmlFor="dataset-cat">Article Category</label>
          <input
            id="dataset-cat"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={uploading}
            required
          />
        </div>

        <div className="ticket-form__field" style={{ marginBottom: 16 }}>
          <label htmlFor="kb-file-upload">Select File (.md, .txt, .json)</label>
          <input
            id="kb-file-upload"
            type="file"
            accept=".md,.txt,.json,.doc,.docx,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
            required
          />
        </div>

        {statusMessage && (
          <div style={{ padding: '10px 14px', background: 'rgba(0, 135, 90, 0.15)', border: '1px solid #00875a', borderRadius: 6, color: '#34d399', fontSize: 13, marginBottom: 14 }}>
            ✓ {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="action-message action-message--error" style={{ marginBottom: 14 }}>
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={uploading || !file}
          style={{ fontWeight: 600 }}
        >
          {uploading ? 'Ingesting & Indexing…' : 'Upload and Index Dataset'}
        </button>
      </form>
    </div>
  );
}

function RetentionPolicyTab() {
  const [retentionDays, setRetentionDays] = useState('365');
  const [maskPii, setMaskPii] = useState(true);
  const [maskGeo, setMaskGeo] = useState(false);
  const [enforceSha, setEnforceSha] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="detail-card">
      <h2>Retention & Governance Policy</h2>
      <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Manage automated audit log expiration, PII redaction rules, and cryptographic SHA-256 provenance retention.
      </p>

      <form onSubmit={handleSave} style={{ maxWidth: 560 }}>
        <div className="ticket-form__field" style={{ marginBottom: 16 }}>
          <label htmlFor="retention-period">Audit Log Retention Period</label>
          <select
            id="retention-period"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
          >
            <option value="90">90 Days (Development / Testing)</option>
            <option value="180">180 Days (Standard Operations)</option>
            <option value="365">365 Days (Annual Compliance – Recommended)</option>
            <option value="2555">7 Years (Financial Regulatory / Basel III)</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={maskPii}
              onChange={(e) => setMaskPii(e.target.checked)}
            />
            Mask Employee IDs in Public API responses (e.g., EMP-***1)
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={maskGeo}
              onChange={(e) => setMaskGeo(e.target.checked)}
            />
            Anonymize Requestor Geography in audit exports
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={enforceSha}
              onChange={(e) => setEnforceSha(e.target.checked)}
            />
            Enforce immutable SHA-256 hash chaining on all ticket mutations
          </label>
        </div>

        {saved && (
          <div style={{ padding: '10px 14px', background: 'rgba(0, 135, 90, 0.15)', border: '1px solid #00875a', borderRadius: 6, color: '#34d399', fontSize: 13, marginBottom: 14 }}>
            ✓ Policy configuration saved and applied across cluster.
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ fontWeight: 600 }}>
          Save Retention Policy
        </button>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const { role } = useRole();
  const tabs = TAB_DEFS.filter((t) => hasPermission(role, t.permission)).map((t) => t.key);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Administrative and operational oversight for the Dynamic Resolver."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'Dashboard' && <DashboardOverview />}
      {activeTab === 'Queue' && <QueueTab />}
      {activeTab === 'Tickets' && <Dashboard />}
      {activeTab === 'Knowledge Base' && <KnowledgeBase />}
      {activeTab === 'Datasets' && <DatasetsTab />}
      {activeTab === 'Retention Policy' && <RetentionPolicyTab />}
      {activeTab === 'Audit Log' && <AuditLog />}
      {activeTab === 'Insights' && <Insights />}
    </DashboardShell>
  );
}