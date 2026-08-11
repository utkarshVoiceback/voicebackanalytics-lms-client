import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'super-admin') navigate('/super-admin');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/learner');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Learning Module Login</h2>
        <p className="muted">Passenger Services Training Platform</p>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="muted small">
          Default super-admin (seeded on server boot): <br />
          <code>superadmin@lms.com</code> / <code>SuperAdmin@123</code>
        </p>
      </form>
    </div>
  );
}
