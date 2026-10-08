import './Sidebar.css';

export default function Sidebar({ open, onClose, items = [] }) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`sidebar ${open ? 'sidebar--open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar__brand">
          <span className="sidebar__brand-indicator" aria-hidden="true" />

          <div className="sidebar__brand-copy">
            <span className="sidebar__brand-title">Self-Healing</span>
            <span className="sidebar__brand-subtitle">Controller</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar__link ${
                item.active ? 'sidebar__link--active' : ''
              }`}
              aria-current={item.active ? 'page' : undefined}
              onClick={() => {
                item.onClick();
                onClose?.();
              }}
            >
              <span className="sidebar__link-label">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
