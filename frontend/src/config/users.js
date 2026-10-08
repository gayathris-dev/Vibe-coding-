// Centralized dummy user directory for the frontend demo login.
// This is NOT real authentication — plaintext passwords exist here only
// because there is no backend yet. Replace authenticate() with a real
// login API call once the backend exists; nothing else should need to
// change, since Login.jsx only calls this function.
export const DUMMY_USERS = [
  { username: 'admin', password: 'admin123', role: 'Admin' },
  { username: 'analyst', password: 'analyst123', role: 'Analyst' },
  { username: 'viewer', password: 'viewer123', role: 'Viewer' },
];

export function authenticate(username, password) {
  const user = DUMMY_USERS.find(
    (u) => u.username === username && u.password === password
  );

  return user ? { username: user.username, role: user.role } : null;
}