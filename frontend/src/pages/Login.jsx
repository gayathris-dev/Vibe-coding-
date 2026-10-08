import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { ROLE_HOME } from '../config/permissions';
import { authenticate } from '../config/users';

// Independent entry point — no connection to ticket submission.
export default function Login() {
  const navigate = useNavigate();
  const { login } = useRole();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const user = authenticate(username.trim(), password);

    if (!user) {
      setError('Invalid username or password.');
      return;
    }

    setError('');
    login(user.role, user.username);
    navigate(ROLE_HOME[user.role]);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-page__title">Dynamic Resolver</h1>
        <p className="auth-page__subtitle">Log in to continue.</p>

        <form className="ticket-form" onSubmit={handleSubmit}>
          <div className="ticket-form__field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="ticket-form__field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="action-message" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {error}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Login
            </button>
          </div>
        </form>

        <p className="ticket-form__note">
          Demo credentials only — admin/admin123, analyst/analyst123,
          viewer/viewer123. This is not real authentication; real
          JWT-based login will replace this once the backend is connected.
        </p>
      </div>
    </div>
  );
}