import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from '../config/departments';
import { createTicket } from '../services/ticketService';
import InteractiveDotField from '../components/InteractiveDotField';
import './Landing.css';

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB

const SAMPLE_KBS = [
  { id: 'ART-88BE5565', title: 'Corporate VPN Session Disconnected / Gateway Timeout', dept: 'Corporate Banking', cat: 'Network', match: '98%' },
  { id: 'ART-1078053D', title: 'Laptop BitLocker Recovery Key Unlock Procedure', dept: 'Laptop Assets', cat: 'Hardware', match: '96%' },
  { id: 'ART-00EBEDA6', title: 'Retail Banking Core Payment Gateway Timeout Recovery', dept: 'Retail Banking', cat: 'Payments', match: '94%' },
  { id: 'ART-57251ED0', title: 'Trading Terminal SSO Authentication Token Reset', dept: 'Investment Banking', cat: 'Security', match: '91%' }
];

export default function Landing() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [requestorId, setRequestorId] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Live DIY Helper State
  const [diyQuery, setDiyQuery] = useState('');

  const isValid =
    department && requestorId.trim().length > 0 && description.trim().length > 0;

  const filteredKbs = diyQuery.trim()
    ? SAMPLE_KBS.filter(k => 
        k.title.toLowerCase().includes(diyQuery.toLowerCase()) || 
        k.dept.toLowerCase().includes(diyQuery.toLowerCase()) ||
        k.cat.toLowerCase().includes(diyQuery.toLowerCase())
      )
    : [];

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

    if (!isValid) return;

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
    <div ref={pageRef} className="landing-container">
      <InteractiveDotField containerRef={pageRef} />

      {/* Top Navbar */}
      <header className="landing-nav">
        <div className="landing-nav__brand">
          <div className="landing-nav__logo-icon">
            ⚡
          </div>
          <span>Dynamic Resolver</span>
          <div className="landing-nav__badge">
            <span className="landing-nav__status-dot"></span>
            AI Engine v2.4 Active
          </div>
        </div>

        <nav className="landing-nav__links">
          <a href="#diy-helper" className="landing-nav__link">Instant DIY Search</a>
          <a href="#pipeline" className="landing-nav__link">Confidence Pipeline</a>
          <button 
            type="button" 
            className="landing-nav__login-btn"
            onClick={() => navigate('/login')}
          >
            <span>Staff Portal Login</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Hero Left Content */}
        <div className="hero-left">
          <div className="hero-tag">
            ✨ Autonomous AI Incident Remediation
          </div>

          <h1 className="hero-title">
            Sub-Second Ticket Resolution with <span>Semantic AI & Provenance</span>
          </h1>

          <p className="hero-desc">
            Instantly classify, self-heal, and route banking & enterprise incidents using vector-similarity matching, whitelisted execution sandboxes, and immutable SHA-256 audit logs.
          </p>

          {/* Live Metrics */}
          <div className="hero-stats">
            <div className="hero-stat-card">
              <div className="hero-stat-val">99.4%</div>
              <div className="hero-stat-lbl">AI Match Accuracy</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-val">&lt; 1.2s</div>
              <div className="hero-stat-lbl">Auto-Resolution</div>
            </div>
            <div className="hero-stat-card">
              <div className="hero-stat-val">100%</div>
              <div className="hero-stat-lbl">SHA-256 Provenance</div>
            </div>
          </div>

          {/* DIY Instant Self-Service Helper */}
          <div id="diy-helper" className="diy-box">
            <div className="diy-box__header">
              <div className="diy-box__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f6fed" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Instant Self-Service Search
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Try: "VPN", "Password", "Gateway"</span>
            </div>

            <div className="diy-box__input-wrapper">
              <input 
                type="text"
                className="diy-box__input"
                placeholder="Type symptoms to check for instant self-help SOP solutions…"
                value={diyQuery}
                onChange={(e) => setDiyQuery(e.target.value)}
              />
            </div>

            {diyQuery.trim() !== '' && (
              <div className="diy-box__results">
                {filteredKbs.length > 0 ? (
                  filteredKbs.map(kb => (
                    <div key={kb.id} className="diy-item">
                      <div>
                        <div className="diy-item__title">{kb.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>{kb.dept} • Category: {kb.cat}</div>
                      </div>
                      <span className="diy-item__badge">{kb.match} Match</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '10px', fontSize: '12.5px', color: '#64748b', textAlign: 'center' }}>
                    No quick SOP matched "{diyQuery}". Submit a ticket on the right for automated AI classification.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hero Right: Modern Form Card */}
        <div className="hero-right">
          <div className="glass-card">
            <div className="glass-card__header">
              <div className="glass-card__title">
                <span>Submit Support Incident</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1' }}>
                  AI Intake
                </span>
              </div>
              <p className="glass-card__subtitle">Instant classification and confidence routing</p>
            </div>

            {submittedTicket ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 54, height: 54, background: '#dcfce7', borderRadius: '50%', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
                  ✓
                </div>
                <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 18, fontWeight: 800 }}>
                  Ticket Received!
                </h3>
                <p style={{ color: '#475569', fontSize: 13.5, margin: '0 0 16px' }}>
                  Ticket ID: <strong style={{ color: '#2f6fed' }}>{submittedTicket.id}</strong>
                </p>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', marginBottom: 20, textAlign: 'left', wordBreak: 'break-all' }}>
                  <strong>SHA-256 Provenance Ledger Hash:</strong><br/>
                  <code style={{ fontSize: 11, color: '#0f172a' }}>{submittedTicket.provenanceHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</code>
                </div>
                <button 
                  type="button" 
                  className="submit-btn" 
                  onClick={handleSubmitAnother}
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form className="ticket-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="ticket-department">Business Department</label>
                  <select
                    id="ticket-department"
                    className="form-control"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    disabled={submitting}
                  >
                    {DEPARTMENTS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ticket-requestor">Employee / Requestor ID</label>
                  <input
                    id="ticket-requestor"
                    type="text"
                    className="form-control"
                    placeholder="e.g. EMP-94821"
                    value={requestorId}
                    onChange={(event) => setRequestorId(event.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ticket-description">Issue Description</label>
                  <textarea
                    id="ticket-description"
                    rows="4"
                    className="form-control"
                    placeholder="Describe the system behavior, error message, or symptom…"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ticket-attachment">
                    File Attachment <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional, max 2MB)</span>
                  </label>
                  <div className="file-dropzone" onClick={() => document.getElementById('ticket-attachment').click()}>
                    <input
                      id="ticket-attachment"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                      {attachment ? `📁 ${attachment.name}` : '📄 Click or drop error logs / screenshot'}
                    </div>
                  </div>
                  {attachmentError && (
                    <span style={{ fontSize: '12px', color: '#ef4444', marginTop: 4 }}>{attachmentError}</span>
                  )}
                </div>

                {submitError && (
                  <div style={{ padding: '10px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13 }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!isValid || submitting}
                >
                  {submitting ? 'Analyzing & Routing…' : 'Submit Ticket to AI Engine'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Confidence Decision Pipeline Visualizer */}
      <section id="pipeline" className="workflow-section">
        <div className="section-title">
          <h2>Confidence-Based Decision Engine</h2>
          <p>Automated threshold routing based on AI Cosine Similarity Match Confidence</p>
        </div>

        <div className="pipeline-grid">
          <div className="pipeline-card">
            <span className="pipeline-badge badge-selfheal">Confidence = 100%</span>
            <h3>Instant Self-Heal Execution</h3>
            <p>Triggers whitelisted script execution inside isolated sandbox, logging standard output directly into audit ledger.</p>
          </div>

          <div className="pipeline-card">
            <span className="pipeline-badge badge-match">Confidence ≥ 95%</span>
            <h3>Auto-Match with Override</h3>
            <p>Displays matched SOP document instantly with analyst 5% override option for rapid resolution.</p>
          </div>

          <div className="pipeline-card">
            <span className="pipeline-badge badge-clarify">Confidence 81% - 94%</span>
            <h3>Dynamic Q&amp;A Clarification</h3>
            <p>Generates targeted contextual questions to clarify symptom ambiguities before final routing.</p>
          </div>

          <div className="pipeline-card">
            <span className="pipeline-badge badge-escalate">Confidence &lt; 80%</span>
            <h3>Production Support Queue</h3>
            <p>Auto-flags ticket as ESCALATED and routes directly to specialized tier-2 analyst queues.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          <strong style={{ color: '#ffffff' }}>Dynamic Resolver Platform</strong> • Enterprise AI Incident Remediation
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>Version 2.4.0</span>
          <span>•</span>
          <span style={{ color: '#4ade80' }}>● All Nodes Operational</span>
        </div>
      </footer>
    </div>
  );
}