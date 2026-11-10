import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useLiveEvents } from '../hooks/useLiveEvents.js';

const STEPS = [
  { key: 'open', label: 'Report Received', desc: 'Queued in municipal dispatch' },
  { key: 'assigned', label: 'Crew Assigned', desc: 'Field technician en route' },
  { key: 'in_progress', label: 'Work In Progress', desc: 'Repair / containment active' },
  { key: 'resolved', label: 'Issue Resolved', desc: 'Repairs verified & completed' },
];

export default function TrackReport() {
  const { referenceCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(referenceCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [incident, setIncident] = useState(null);

  const lookup = useCallback(async (value) => {
    if (!value?.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/incidents/track/${value.trim()}`);
      setIncident(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "We couldn't find a report with that reference code. Please verify the code and try again."
          : 'Something went wrong looking that up. Try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (referenceCode) {
      lookup(referenceCode);
    }
  }, [referenceCode, lookup]);

  // Real-time live status updates for the citizen without page refresh
  useLiveEvents((eventType, data) => {
    const currentRef = incident?.referenceCode || incident?.reference_code;
    const incomingRef = data?.referenceCode || data?.reference_code;
    if (currentRef && incomingRef && currentRef.toUpperCase() === incomingRef.toUpperCase()) {
      setIncident((prev) => ({ ...prev, ...data }));
    }
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/track/${code.trim()}`);
  }

  const currentStatus = incident?.status || 'open';
  const currentStepIndex =
    currentStatus === 'resolved'
      ? 3
      : currentStatus === 'in_progress'
      ? 2
      : currentStatus === 'assigned'
      ? 1
      : 0;

  const ref = incident?.referenceCode || incident?.reference_code;
  const issue = incident?.issueType || incident?.issue_type;
  const image = incident?.imageUrl || incident?.image_url;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl font-extrabold text-primary-dark">
            AquaSync
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="text-ink/70 hover:text-ink">
              Report an issue
            </Link>
            <Link to="/helplines" className="text-ink/70 hover:text-ink">
              Emergency Helplines
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-ink">Track Incident Status</h1>
        <p className="mt-1 text-sm text-ink/70">
          Enter your reference code to inspect real-time dispatch progress, assigned crew, and resolution status.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            className="field-input ref-code uppercase"
            placeholder="e.g. AQ-9K42X"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-primary shrink-0 px-6 font-semibold" type="submit">
            Search
          </button>
        </form>

        <div className="mt-8">
          {loading && (
            <div className="flex justify-center py-12">
              <Spinner label="Looking up your incident record…" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger-dark">
              {error}
            </div>
          )}

          {!loading && incident && (
            <div className="card space-y-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="ref-code text-sm font-bold text-primary-dark">{ref}</span>
                    <span className="rounded bg-surface px-2 py-0.5 text-xs text-ink/60 capitalize">
                      {incident.severity} Urgency
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold capitalize text-ink">
                    {(issue || '').replace(/_/g, ' ')}
                  </h2>
                  <p className="text-sm text-ink/70">📍 {incident.location}</p>
                </div>
                <StatusBadge status={incident.status} />
              </div>

              {/* Real-time Progress Pipeline Tracker */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                  Live Dispatch Timeline
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {STEPS.map((s, idx) => {
                    const isDone = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div
                        key={s.key}
                        className={`rounded-xl border p-3 transition-all ${
                          isCurrent
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : isDone
                            ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'border-line bg-surface/40 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              isDone ? 'bg-primary text-white' : 'bg-line text-ink/40'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </span>
                          <span className="text-xs font-bold text-ink">{s.label}</span>
                        </div>
                        <p className="mt-2 text-[11px] text-ink/60">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photo Evidence if uploaded */}
              {image && (
                <div className="border-t border-line pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                    Citizen Photo Evidence
                  </h3>
                  <div className="mt-2 max-w-md overflow-hidden rounded-xl border border-line bg-surface">
                    <img
                      src={image}
                      alt="Incident proof"
                      className="h-56 w-full object-cover sm:h-64"
                    />
                  </div>
                </div>
              )}

              {/* Incident Details Summary */}
              <dl className="space-y-3 border-t border-line pt-4 text-sm">
                {incident.description && (
                  <div>
                    <dt className="text-xs font-medium text-ink/50">Description</dt>
                    <dd className="mt-0.5 text-ink/80">{incident.description}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-line/50 pt-2 text-xs text-ink/60">
                  <span>First Logged</span>
                  <span className="font-mono">
                    {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-ink/60">
                  <span>Last Update</span>
                  <span className="font-mono">
                    {incident.updatedAt ? new Date(incident.updatedAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </dl>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
