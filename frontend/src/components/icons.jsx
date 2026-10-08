function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconLogoMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#2f6fed" />
      <path
        d="M6 13h3l2-4 3 8 2-4h2"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconBack(props) {
  return <Icon {...props}><path d="M19 12H5" /><path d="M11 18l-6-6 6-6" /></Icon>;
}

export function IconDashboard(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  );
}

export function IconTicket(props) {
  return (
    <Icon {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <path d="M10 6v12" strokeDasharray="2 2" />
    </Icon>
  );
}

export function IconInsights(props) {
  return (
    <Icon {...props}>
      <path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M4 19h16" />
    </Icon>
  );
}

export function IconKnowledge(props) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5z" />
      <path d="M20 18H6.5A2.5 2.5 0 0 0 4 20.5" />
    </Icon>
  );
}

export function IconQueue(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M17 4.5a3 3 0 0 1 0 6" />
      <path d="M20 20a6 6 0 0 0-3.5-8.2" />
    </Icon>
  );
}

export function IconDataset(props) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </Icon>
  );
}

export function IconPolicy(props) {
  return <Icon {...props}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" /></Icon>;
}

export function IconAudit(props) {
  return (
    <Icon {...props}>
      <path d="M9 4h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8l3-4z" />
      <path d="M9 4v4H5" /><path d="M9 12h6M9 16h6" />
    </Icon>
  );
}

export function IconReports(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  );
}

export function IconDefault(props) {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /></Icon>;
}

export const ICONS_BY_TAB = {
  'Dashboard': IconDashboard,
  'Tickets': IconTicket,
  'Insights': IconInsights,
  'Knowledge Base': IconKnowledge,
  'Queue': IconQueue,
  'Datasets': IconDataset,
  'Retention Policy': IconPolicy,
  'Audit Log': IconAudit,
  'Reports': IconReports,
  '← Dashboard': IconBack,
};