import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    // Wire this up once the /incidents endpoint exists (roadmap item).
    // Expected shape: [{ id, title, status, created_at }]
    api
      .get('/incidents', { params: { reporter_id: user.id } })
      .then(({ data }) => {
        if (!cancelled) {
          setReports(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p className="dashboard-subtitle">Report a water issue in your area or track ones you've already sent in.</p>
        </div>

        <div className="card-grid">
          <button className="card card-action">
            <span className="card-action-icon">+</span>
            <span>Report a new issue</span>
          </button>

          <div className="card">
            <h2 className="card-title">Your reports</h2>

            {status === 'loading' && <p className="muted">Loading your reports…</p>}

            {status === 'error' && (
              <p className="muted">
                Reports aren't available yet — the incident tracking API is on AquaSync's roadmap.
              </p>
            )}

            {status === 'ready' && reports.length === 0 && (
              <p className="muted">You haven't reported anything yet.</p>
            )}

            {status === 'ready' && reports.length > 0 && (
              <ul className="report-list">
                {reports.map((r) => (
                  <li key={r.id}>
                    <span>{r.title}</span>
                    <span className={`status-pill status-${r.status}`}>{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
