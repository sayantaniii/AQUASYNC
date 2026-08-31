import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-danger-dark">403</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold">You don't have access to this page</h1>
      <p className="mt-2 max-w-sm text-ink/60">
        Your account role doesn't include this dashboard. Ask an admin if you think this is wrong.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
