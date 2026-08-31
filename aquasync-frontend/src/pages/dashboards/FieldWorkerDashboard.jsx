import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StaffNavbar from '../../components/StaffNavbar.jsx';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const NEXT_STATUS = {
  assigned: 'in_progress',
  in_progress: 'resolved',
};

const NEXT_LABEL = {
  assigned: 'Start work',
  in_progress: 'Mark resolved',
};

export default function FieldWorkerDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/incidents/assigned-to-me');
      setIncidents(data);
    } catch {
      setError('Could not load your assigned reports.');
    } finally {
      setLoading(false);
    }
  }

  async function advance(incident) {
    const next = NEXT_STATUS[incident.status];
    if (!next) return;
    setUpdatingId(incident.id);
    try {
      await api.patch(`/incidents/${incident.id}/status`, { status: next });
      setIncidents((list) =>
        list.map((i) => (i.id === incident.id ? { ...i, status: next } : i))
      );
    } catch {
      setError('Could not update that report — try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <StaffNavbar />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-2xl font-extrabold">Assigned to you</h1>
        <p className="mt-1 text-ink/60">Work through these in order of urgency.</p>

        {error && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : incidents.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-line py-10 text-center text-ink/50">
            Nothing assigned to you right now.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {incidents.map((incident) => (
              <li key={incident.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="ref-code text-xs text-ink/50">{incident.referenceCode}</p>
                    <h2 className="mt-1 font-display font-bold capitalize">
                      {incident.issueType?.replace(/_/g, ' ')}
                    </h2>
                    <p className="mt-1 text-sm text-ink/70">{incident.location}</p>
                  </div>
                  <StatusBadge status={incident.severity === 'urgent' ? 'urgent' : incident.status} />
                </div>
                {incident.description && (
                  <p className="mt-3 text-sm text-ink/70">{incident.description}</p>
                )}
                {NEXT_STATUS[incident.status] && (
                  <button
                    onClick={() => advance(incident)}
                    disabled={updatingId === incident.id}
                    className="btn-primary mt-4"
                  >
                    {updatingId === incident.id ? 'Updating…' : NEXT_LABEL[incident.status]}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
