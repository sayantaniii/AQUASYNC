import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios.js';
import StaffNavbar from '../../components/StaffNavbar.jsx';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'reported', label: 'Unassigned' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function OperatorDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('reported');
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [incidentsRes, workersRes] = await Promise.all([
        api.get('/incidents'),
        api.get('/users?role=field_worker'),
      ]);
      setIncidents(incidentsRes.data);
      setFieldWorkers(workersRes.data);
    } catch {
      setError('Could not load the incident queue.');
    } finally {
      setLoading(false);
    }
  }

  async function assign(incidentId, fieldWorkerId) {
    if (!fieldWorkerId) return;
    setAssigningId(incidentId);
    try {
      await api.patch(`/incidents/${incidentId}/assign`, { fieldWorkerId });
      setIncidents((list) =>
        list.map((i) =>
          i.id === incidentId ? { ...i, status: 'assigned', assignedTo: fieldWorkerId } : i
        )
      );
    } catch {
      setError('Could not assign that report — try again.');
    } finally {
      setAssigningId(null);
    }
  }

  const visible = useMemo(
    () => (filter === 'all' ? incidents : incidents.filter((i) => i.status === filter)),
    [incidents, filter]
  );

  return (
    <div className="min-h-screen bg-surface">
      <StaffNavbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Incident queue</h1>
            <p className="mt-1 text-ink/60">Dispatch reports to field crews as they come in.</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-line bg-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  filter === f.value ? 'bg-primary text-white' : 'text-ink/60 hover:bg-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-line py-10 text-center text-ink/50">
            No reports in this view.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {visible.map((incident) => (
              <li key={incident.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="ref-code text-xs text-ink/50">{incident.referenceCode}</p>
                  <h2 className="mt-1 font-display font-bold capitalize">
                    {incident.issueType?.replace(/_/g, ' ')}
                  </h2>
                  <p className="mt-1 text-sm text-ink/70">{incident.location}</p>
                  <div className="mt-2">
                    <StatusBadge status={incident.severity === 'urgent' ? 'urgent' : incident.status} />
                  </div>
                </div>

                {incident.status === 'reported' ? (
                  <select
                    className="field-input w-full sm:w-56"
                    defaultValue=""
                    disabled={assigningId === incident.id}
                    onChange={(e) => assign(incident.id, e.target.value)}
                  >
                    <option value="" disabled>
                      {assigningId === incident.id ? 'Assigning…' : 'Assign to…'}
                    </option>
                    {fieldWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-mono text-xs text-ink/40">
                    {incident.assignedToName ? `→ ${incident.assignedToName}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
