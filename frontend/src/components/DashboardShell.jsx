import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const DESKTOP_BREAKPOINT = 1024;

export default function DashboardShell({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
}) {
  const [navOpen, setNavOpen] = useState(
    () => window.innerWidth >= DESKTOP_BREAKPOINT,
  );
  const location = useLocation();

  useEffect(() => {
    setNavOpen(window.innerWidth >= DESKTOP_BREAKPOINT);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setNavOpen(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const items = tabs.map((tab) => ({
    key: tab,
    label: tab,
    active: activeTab === tab,
    onClick: () => {
      onTabChange(tab);
      if (window.innerWidth < DESKTOP_BREAKPOINT) {
        setNavOpen(false);
      }
    },
  }));

  return (
    <div className="app-shell">
      <Header
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((value) => !value)}
      />

      <div className="app-body">
        <Sidebar
          open={navOpen}
          onClose={() => setNavOpen(false)}
          items={items}
        />

        <main className="app-main">
          <div className="page">
            {(title || subtitle) && (
              <div className="page-header">
                <div>
                  {title && <h1>{title}</h1>}
                  {subtitle && <p>{subtitle}</p>}
                </div>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
