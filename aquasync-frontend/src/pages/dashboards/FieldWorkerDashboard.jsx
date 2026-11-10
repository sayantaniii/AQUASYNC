import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios.js';
import StaffNavbar from '../../components/StaffNavbar.jsx';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import InteractiveMap from '../../components/InteractiveMap.jsx';
import { useLiveEvents } from '../../hooks/useLiveEvents.js';

const NEXT_STATUS = {
  assigned: 'in_progress',
  in_progress: 'resolved',
};

const NEXT_LABEL = {
  assigned: '⚡ Begin Work',
  in_progress: '✓ Mark Resolved',
};

export default function FieldWorkerDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [filter, setFilter] = useState('active'); // 'active' | 'resolved' | 'all'
  const [lightboxImage, setLightboxImage] = useState(null);

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

  // Real-time live updates
  const { connected } = useLiveEvents((eventType) => {
    if (eventType === 'assigned' || eventType === 'created' || eventType === 'status_changed') {
      load();
    }
  });

  async function advance(incident) {
    const next = NEXT_STATUS[incident.status];
    if (!next) return;
    setUpdatingId(incident.id);
    try {
      const { data } = await api.patch(`/incidents/${incident.id}/status`, { status: next });
      setIncidents((list) =>
        list.map((i) => (i.id === incident.id ? { ...i, ...data, status: next } : i))
      );
    } catch {
      setError('Could not update that report — please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  const visible = useMemo(() => {
    if (filter === 'active') {
      return incidents.filter((i) => i.status === 'assigned' || i.status === 'in_progress');
    }
    if (filter === 'resolved') {
      return incidents.filter((i) => i.status === 'resolved');
    }
    return incidents;
  }, [incidents, filter]);

  return (
    <div className="min-h-screen bg-surface">
      <StaffNavbar />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold text-ink">Field Crew Work Orders</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  connected ? 'bg-emerald-100 text-emerald-800' : 'bg-surface text-ink/50'
                }`}
              >
                ● {connected ? 'Live Connected' : 'Syncing'}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/60">
              Execute urgent water repairs in order of severity. Check photos and site maps before dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-line bg-card p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
                }`}
              >
                ☰ Work Orders
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'map' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
                }`}
              >
                🗺️ Route Map
              </button>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="mt-4 flex gap-2">
          {[
            { value: 'active', label: 'Active Work Orders' },
            { value: 'resolved', label: 'Completed' },
            { value: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-line bg-card text-ink/60 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner label="Loading your work orders…" />
          </div>
        ) : viewMode === 'map' ? (
          <div className="mt-6">
            <InteractiveMap
              mode="viewer"
              incidents={visible}
              height="500px"
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-card/50 py-16 text-center text-sm text-ink/50">
            {filter === 'active'
              ? 'No active work orders currently assigned to you. Stand by for dispatcher alert.'
              : 'No completed work orders found.'}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {visible.map((incident) => {
              const ref = incident.referenceCode || incident.reference_code;
              const issue = incident.issueType || incident.issue_type;
              const image = incident.imageUrl || incident.image_url;

              return (
                <div
                  key={incident.id}
                  className="card border border-line bg-card shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {image ? (
                        <div
                          onClick={() => setLightboxImage(image)}
                          className="h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line bg-surface"
                        >
                          <img
                            src={image}
                            alt="Damage evidence"
                            className="h-full w-full object-cover transition hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface text-2xl">
                          💧
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="ref-code text-xs font-bold text-primary-dark">{ref}</span>
                          <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/60">
                            {incident.severity}
                          </span>
                        </div>
                        <h2 className="mt-1 font-display text-lg font-bold capitalize text-ink">
                          {(issue || '').replace(/_/g, ' ')}
                        </h2>
                        <p className="text-xs text-ink/70">📍 {incident.location}</p>
                        {incident.contactPhone && (
                          <p className="mt-1 text-[11px] text-ink/50">
                            📞 Citizen Callback: {incident.contactPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={incident.status} />
                  </div>

                  {incident.description && (
                    <p className="mt-3 rounded-lg bg-surface/50 p-2.5 text-xs text-ink/70">
                      {incident.description}
                    </p>
                  )}

                  {NEXT_STATUS[incident.status] && (
                    <div className="mt-4 flex items-center justify-end border-t border-line pt-3">
                      <button
                        onClick={() => advance(incident)}
                        disabled={updatingId === incident.id}
                        className={`rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                          incident.status === 'assigned'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {updatingId === incident.id ? 'Updating Status…' : NEXT_LABEL[incident.status]}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Photo Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl overflow-hidden rounded-2xl bg-card p-2 shadow-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-white hover:bg-black"
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Full Damage Proof" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
