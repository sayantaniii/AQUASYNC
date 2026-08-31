import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

const linkClasses = ({ isActive }) =>
  `font-display text-sm font-semibold transition ${
    isActive ? 'text-primary' : 'text-ink/70 hover:text-ink'
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="font-display text-lg font-extrabold text-ink">
          AquaSync
        </NavLink>

        <div className="flex items-center gap-5">
          <NavLink to="/" end className={linkClasses}>
            Report
          </NavLink>
          <NavLink to="/track" className={linkClasses}>
            Track
          </NavLink>
          <NavLink to="/helplines" className={linkClasses}>
            Emergency Helplines
          </NavLink>
          <NavLink to="/staff/login" className={linkClasses}>
            Staff
          </NavLink>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}