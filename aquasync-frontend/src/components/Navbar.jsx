import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  citizen: 'Citizen',
  field_worker: 'Field Worker',
  operator: 'Operator',
  admin: 'Admin'
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-mark" aria-hidden="true">
          <svg viewBox="0 0 40 16" width="32" height="14">
            <path
              d="M0 8 Q5 0 10 8 T20 8 T30 8 T40 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="navbar-title">AquaSync</span>
      </div>

      {user && (
        <div className="navbar-user">
          <span className={`role-badge role-${user.role}`}>{ROLE_LABELS[user.role] ?? user.role}</span>
          <span className="navbar-name">{user.name}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
