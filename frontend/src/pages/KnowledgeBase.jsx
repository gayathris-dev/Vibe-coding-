import { useEffect, useState, useMemo } from 'react';
import { DEPARTMENTS } from '../config/departments';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [selectedDept]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const url = selectedDept !== 'All' 
        ? `/api/articles?department_id=${encodeURIComponent(selectedDept)}` 
        : '/api/articles';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArticles(data);
      if (data.length > 0) {
        setSelectedArticle(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((a) =>
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.body_text && a.body_text.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q)) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [articles, searchQuery]);

  return (
    <div className="page">
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Knowledge Base Repository</h1>
          <p>Standard Operating Procedures (SOPs), diagnostic steps, and remediation scripts segmented by domain.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search SOP articles, scripts, tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: '13px',
              minWidth: 230
            }}
          />

          <div className="department-filter" style={{ margin: 0 }}>
            <label htmlFor="kb-department" style={{ display: 'none' }}>Domain Filter</label>
            <select
              id="kb-department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="All">All Domains ({articles.length} Articles)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="state-block state-loading">Loading knowledge base articles…</div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(290px, 1fr) 2fr', gap: '20px', marginTop: '14px' }}>
          {/* Left Column: Article List */}
          <div className="detail-card" style={{ padding: '16px', maxHeight: '640px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                Articles ({filteredArticles.length})
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{selectedDept}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredArticles.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #00875a' : '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(0, 135, 90, 0.12)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      {art.department_name || art.department_id} • v{art.version}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.3, color: 'var(--color-text)' }}>
                      {art.title}
                    </div>
                    {art.script_path && (
                      <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#064e3b', color: '#6ee7b7', fontWeight: 600 }}>
                        ⚡ Script: {art.script_path.split('/').pop()}
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredArticles.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No articles matched your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Article View */}
          <div className="detail-card">
            {selectedArticle ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {selectedArticle.department_name || selectedArticle.department_id} • Category: {selectedArticle.category}
                    </span>
                    <h2 style={{ margin: '4px 0 0 0', color: 'var(--color-text)' }}>{selectedArticle.title}</h2>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#1e293b', color: '#93c5fd', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                    Revision v{selectedArticle.version}
                  </span>
                </div>

                {selectedArticle.script_path && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(6, 78, 59, 0.25)', border: '1px solid rgba(16, 185, 129, 0.4)', marginBottom: '14px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text)' }}>Automation Hook: <code style={{ color: '#6ee7b7', background: '#0b1120', padding: '2px 6px', borderRadius: 4 }}>{selectedArticle.script_path}</code></span>
                    <strong style={{ color: '#34d399', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WHITELISTED</strong>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {(selectedArticle.tags || []).map((t, idx) => (
                    <span key={idx} style={{ padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace' }}>
                      #{t}
                    </span>
                  ))}
                </div>

                <div style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '20px',
                  borderRadius: '8px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '13px',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
                }}>
                  {selectedArticle.body_text}
                </div>
              </div>
            ) : (
              <div className="state-block state-empty">Select an article from the left list.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}