import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useRole } from '../context/RoleContext';
import { ROLE_HOME } from '../config/permissions';

export default function AppLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const items = [
    {
      key: 'dashboard',
      label: '← Dashboard',
      active: false,
      onClick: () => navigate(ROLE_HOME[role] || '/login'),
    },
  ];

  return (
    <div className="app-shell">
      <Header navOpen={navOpen} onToggleNav={() => setNavOpen((v) => !v)} />
      <div className="app-body">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} items={items} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}