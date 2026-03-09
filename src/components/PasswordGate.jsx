import React, { useState, useEffect } from 'react';

const SESSION_KEY = 'pt_auth';
const PASSWORD_HASH = import.meta.env.VITE_APP_PASSWORD_HASH;

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const hash = await sha256(password);

    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthenticated(true);
    } else {
      setError('Incorrect password.');
      setPassword('');
    }
    setLoading(false);
  };

  if (authenticated) return children;

  return (
    <div className="password-gate">
      <div className="password-gate-card">
        <div className="password-gate-icon">🔒</div>
        <h2>Personal Tracker</h2>
        <p>This page is private.</p>
        <form onSubmit={handleSubmit} className="password-gate-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="password-gate-input"
          />
          <button type="submit" disabled={loading} className="password-gate-button">
            {loading ? '...' : 'Unlock'}
          </button>
        </form>
        {error && <p className="password-gate-error">{error}</p>}
      </div>
    </div>
  );
}
