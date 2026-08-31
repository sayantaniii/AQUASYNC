import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABEL = {
  field_worker: 'Field Worker',
  operator: 'Operator',
  admin: 'Admin',
};

export default function StaffNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/staff/login', { replace: true });
  }

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg font-extrabold text-primary-dark">
          AquaSync <span className="font-mono text-xs font-normal text-ink/50">/ staff</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-display text-sm font-semibold leading-tight">{user.name}</p>
              <p className="font-mono text-xs text-ink/50">{ROLE_LABEL[user.role] || user.role}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost px-4 py-2 text-sm">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
