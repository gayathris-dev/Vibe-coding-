export const ROLES = ['Admin', 'Analyst', 'Viewer'];

// Roles an Admin can assign to a pending account in the Queue tab.
// "User" is intentionally NOT the same thing as the dashboard role
// "Viewer" — it exists to classify a pending account before anyone has
// decided whether it should reach a dashboard at all, or with what
// permissions. It has no entry in PERMISSIONS below and no ROLE_HOME —
// it is not a login-capable role in this frontend demo. Wire it to real
// permissions once that's clarified with the mentor/backend team.
export const QUEUE_ROLES = ['User', 'Admin', 'Analyst'];

// Centralized RBAC config — the single source of truth for what each
// dashboard role can do. Components call hasPermission(role, KEY) rather
// than comparing role strings directly.
export const PERMISSIONS = {
  VIEW_DASHBOARD: ['Admin', 'Analyst', 'Viewer'],
  VIEW_TICKET_DETAIL: ['Admin', 'Analyst', 'Viewer'],
  VIEW_INSIGHTS: ['Admin', 'Analyst', 'Viewer'],
  VIEW_KNOWLEDGE_BASE: ['Admin', 'Analyst', 'Viewer'],
  VIEW_REPORTS: ['Admin', 'Viewer'],
  PERFORM_TICKET_ACTIONS: ['Admin', 'Analyst'], // Self-Heal, Override, Ask More, Escalate
  UPLOAD_DATASETS: ['Admin'],
  MANAGE_RETENTION_POLICY: ['Admin'],
  VIEW_AUDIT_LOG: ['Admin'],
  MANAGE_USER_QUEUE: ['Admin'],
};

export function hasPermission(role, permission) {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

export const ROLE_HOME = {
  Admin: '/admin',
  Analyst: '/analyst',
  Viewer: '/viewer',
};