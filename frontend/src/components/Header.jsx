import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { useRole } from '../context/RoleContext';
import { ROLE_HOME } from '../config/permissions';

export default function Header({ navOpen, onToggleNav }) {
  const { role, username, logout } = useRole();
  const navigate = useNavigate();
  const dashboardBase = ROLE_HOME[role] || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [ticketResults, setTicketResults] = useState([]);
  const [articleResults, setArticleResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setTicketResults([]);
      setArticleResults([]);
      setDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = encodeURIComponent(searchTerm.trim());
        const [ticketRes, articleRes] = await Promise.all([
          fetch(`/api/tickets?search=${q}`).then((r) => r.ok ? r.json() : []),
          fetch(`/api/articles?search=${q}`).then((r) => r.ok ? r.json() : [])
        ]);
        setTicketResults((ticketRes || []).slice(0, 5));
        setArticleResults((articleRes || []).slice(0, 4));
        setDropdownOpen(true);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTicket = (ticketId) => {
    setDropdownOpen(false);
    setSearchTerm('');
    navigate(`${dashboardBase}/tickets/${ticketId}`);
  };

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__hamburger"
        aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={navOpen}
        aria-controls="app-sidebar"
        onClick={onToggleNav}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="app-header__brand">
        Dynamic Resolver
      </div>

      <div className="app-header__search" ref={searchContainerRef} style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search tickets by ID, name, articles…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim() && (ticketResults.length || articleResults.length)) {
              setDropdownOpen(true);
            }
          }}
        />

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #dce4df',
            borderRadius: 8,
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
            maxHeight: 380,
            overflowY: 'auto',
            zIndex: 100,
            padding: '8px 0',
            color: '#1a202c'
          }}>
            {isSearching && (
              <div style={{ padding: '8px 16px', fontSize: '12px', color: '#718096' }}>
                Searching…
              </div>
            )}

            {!isSearching && ticketResults.length === 0 && articleResults.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#718096', textAlign: 'center' }}>
                No tickets or articles matched "{searchTerm}"
              </div>
            )}

            {ticketResults.length > 0 && (
              <div>
                <div style={{ padding: '4px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#00853f', letterSpacing: '0.05em' }}>
                  Tickets ({ticketResults.length})
                </div>
                {ticketResults.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #edf2f7',
                      transition: 'background 0.15s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#102d24' }}>
                        <code style={{ background: '#e8f3ed', color: '#006b34', padding: '1px 5px', borderRadius: 4, marginRight: 6 }}>{t.id}</code>
                        {t.department_name || t.department_id}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4a5568', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                        {t.description}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                      background: t.status === 'SELF_HEALED' ? '#d1fae5' : t.status === 'ESCALATED' ? '#fee2e2' : '#fef3c7',
                      color: t.status === 'SELF_HEALED' ? '#065f46' : t.status === 'ESCALATED' ? '#991b1b' : '#92400e'
                    }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {articleResults.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ padding: '4px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#00853f', letterSpacing: '0.05em' }}>
                  Knowledge Base Articles ({articleResults.length})
                </div>
                {articleResults.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setDropdownOpen(false);
                      setSearchTerm('');
                      navigate(dashboardBase);
                    }}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #edf2f7',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#102d24' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#718096', marginTop: 2 }}>
                      {a.department_name || a.department_id} • Category: {a.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="app-header__user">
        <div className="app-header__avatar">{role ? role.charAt(0) : '?'}</div>
        <span className="app-header__role-label">
          {username ? `${username} (${role})` : role}
        </span>
        <button className="app-header__logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}