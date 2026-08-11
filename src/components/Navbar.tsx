import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const ROLE_LABEL: Record<Role, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  learner: 'Learner',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout(): void {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">Passenger Services Training Platform · LMS</div>
      {user && (
        <div className="navbar-user">
          <span className="badge">{ROLE_LABEL[user.role]}</span>
          <span className="navbar-name">{user.name}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
