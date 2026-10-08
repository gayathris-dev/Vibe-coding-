// Mock service for the Admin "Queue" tab — incoming accounts waiting to
// be assigned a role. This is intentionally separate from ticketService.js
// (ticket data) and from config/users.js (the three fixed demo login
// accounts). A real backend would expose this as its own user-management
// endpoint; this is purely a frontend demo of that workflow.
const INITIAL_QUEUE = [
  { username: 'user001', status: 'Pending', assignedRole: null },
  { username: 'user002', status: 'Pending', assignedRole: null },
  { username: 'user003', status: 'Pending', assignedRole: null },
];

let queue = [...INITIAL_QUEUE];

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPendingUsers() {
  await delay();
  return queue.filter((u) => u.status === 'Pending');
}

export async function assignUserRole(username, role) {
  await delay();

  queue = queue.map((u) =>
    u.username === username
      ? { ...u, status: 'Assigned', assignedRole: role }
      : u
  );

  return queue.find((u) => u.username === username) || null;
}