import { useEffect, useState } from 'react';
import { useRole } from '../context/RoleContext';
import { hasPermission } from '../config/permissions';
import StatusBadge from '../components/StatusBadge';

export default function AuditLog() {
  const { role } = useRole();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audit');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError('Unable to load live audit logs from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission(role, 'VIEW_AUDIT_LOG')) {
      fetchLogs();
    }
  }, [role]);

  if (!hasPermission(role, 'VIEW_AUDIT_LOG')) {
    return (
      <div className="state-block state-error">
        Restricted – the Audit Log is available to the Admin role only.
      </div>
    );
  }

  return (
    <div className="detail-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2>Audit Log &amp; Cryptographic Provenance</h2>
          <p style={{ margin: 0 }}>Every override, self-heal, and escalation, with timestamps, user IDs, and SHA-256 hashes.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a 
            href="/api/analytics/export/pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary btn-small"
          >
            Download PDF Report
          </a>
          <a 
            href="/api/analytics/export/csv" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary btn-small"
          >
            Export CSV
          </a>
        </div>
      </div>

      {loading && <div className="state-block state-loading">Loading immutable audit logs…</div>}
      
      {!loading && error && (
        <div className="state-block state-error">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="state-block state-empty">
          No audit entries recorded yet.
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="ticket-table-wrapper">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Ticket ID</th>
                <th>Action</th>
                <th>Actor (Masked)</th>
                <th>Timestamp (UTC)</th>
                <th>SHA-256 State Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.audit_id}>
                  <td data-label="Audit ID">#{entry.audit_id}</td>
                  <td data-label="Ticket ID"><strong>#{entry.ticket_id}</strong></td>
                  <td data-label="Action">
                    <StatusBadge status={entry.action} />
                  </td>
                  <td data-label="Actor">
                    <code>{entry.user_id}</code>
                  </td>
                  <td data-label="Timestamp">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td data-label="Hash" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <code title={entry.ticket_hash}>{entry.ticket_hash.slice(0, 24)}…</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}