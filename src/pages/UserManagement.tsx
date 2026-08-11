import { useEffect, useState, FormEvent } from 'react';
import api from '../api/axios';
import { Role, SafeUser } from '../types';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const EMPTY_FORM: FormState = { name: '', email: '', password: '', role: 'learner' };

export default function UserManagement() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUsers(): Promise<void> {
    setLoading(true);
    try {
      const res = await api.get<{ users: SafeUser[] }>('/users');
      setUsers(res.data.users);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post('/users', form);
      setMessage({ type: 'success', text: `${form.role === 'admin' ? 'Admin' : 'Learner'} account created.` });
      setForm(EMPTY_FORM);
      loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create user' });
    }
  }

  async function handleDeactivateToggle(user: SafeUser): Promise<void> {
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  }

  async function handleDelete(user: SafeUser): Promise<void> {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="grid-2">
      <form className="card" onSubmit={handleCreate}>
        <h3>Create Admin / Learner Account</h3>
        <label>
          Name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </label>
        <label>
          Role
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="learner">Learner</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        <button className="btn btn-primary" type="submit">
          Create Account
        </button>
      </form>

      <div className="card">
        <h3>All Users</h3>
        {loading && <p className="muted">Loading...</p>}
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.id} className="user-item">
              <div>
                <div className="content-title">
                  {u.name} <span className="badge badge-sm">{u.role}</span>
                </div>
                <div className="muted small">
                  {u.email} · {u.isActive ? 'Active' : 'Deactivated'}
                </div>
              </div>
              {u.role !== 'super-admin' && (
                <div className="content-item-actions">
                  <button className="btn btn-secondary" onClick={() => handleDeactivateToggle(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(u)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
