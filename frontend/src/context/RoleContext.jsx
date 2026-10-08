import { createContext, useContext, useState } from 'react';

const RoleContext = createContext(null);

// Frontend-only auth/role state. isAuthenticated + role decide what
// ProtectedRoute allows. username is stored for display only. login()/
// logout() are the seam where real authentication gets wired in later.
export function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (selectedRole, selectedUsername = null) => {
    setRole(selectedRole);
    setUsername(selectedUsername);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setRole(null);
    setUsername(null);
    setIsAuthenticated(false);
  };

  return (
    <RoleContext.Provider value={{ role, username, isAuthenticated, login, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }

  return context;
}