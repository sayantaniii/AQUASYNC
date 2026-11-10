import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios.js';
import StaffNavbar from '../../components/StaffNavbar.jsx';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import InteractiveMap from '../../components/InteractiveMap.jsx';
import SensorMonitor from '../../components/SensorMonitor.jsx';
import { useLiveEvents } from '../../hooks/useLiveEvents.js';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Reports' },
  { value: 'open', label: 'Unassigned / Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function OperatorDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'sensors'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

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
      setError('Could not load the incident queue. Verify backend connection.');
    } finally {
      setLoading(false);
    }
  }

  // Real-time live update hook
  const { connected, lastNotification, clearNotification } = useLiveEvents((eventType, data) => {
    if (eventType === 'created') {
      setIncidents((list) => [data, ...list.filter((i) => i.id !== data.id)]);
    } else if (eventType === 'assigned' || eventType === 'status_changed') {
      setIncidents((list) =>
        list.map((i) => (i.id === data.id ? { ...i, ...data } : i))
      );
    }
  });

  async function assign(incidentId, fieldWorkerId) {
    if (!fieldWorkerId) return;
    setAssigningId(incidentId);
    try {
      const { data } = await api.patch(`/incidents/${incidentId}/assign`, { fieldWorkerId });
      setIncidents((list) =>
        list.map((i) =>
          i.id === incidentId
            ? { ...i, ...data, status: 'assigned', assignedTo: fieldWorkerId, assigned_to: fieldWorkerId }
            : i
        )
      );
    } catch {
      setError('Could not assign that report — please try again.');
    } finally {
      setAssigningId(null);
    }
  }

  const visible = useMemo(() => {
    return incidents.filter((i) => {
      // Status filter
      const status = i.status === 'reported' ? 'open' : i.status;
      const matchesFilter = filter === 'all' ? true : status === filter;

      // Text search
      const q = searchQuery.toLowerCase().trim();
      const ref = (i.referenceCode || i.reference_code || '').toLowerCase();
      const loc = (i.location || '').toLowerCase();
      const issue = (i.issueType || i.issue_type || '').toLowerCase();
      const matchesSearch = !q || ref.includes(q) || loc.includes(q) || issue.includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [incidents, filter, searchQuery]);

  return (
    <div className="min-h-screen bg-surface">
      <StaffNavbar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header & Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold text-ink">
                Dispatcher Command Center
              </h1>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  connected
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {connected ? 'Live Sync Active' : 'Connecting Sync…'}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/60">
              Triage citizen emergencies, dispatch response crews, and monitor municipal water telemetry.
            </p>
          </div>

          {/* Tab Switcher: Queue vs IoT Telemetry */}
          <div className="flex rounded-xl border border-line bg-card p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('queue')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'queue'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              🚨 Incident Queue ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('sensors')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'sensors'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              📡 IoT Sensor Grid
            </button>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {lastNotification && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary-dark shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <div>
                <span className="font-bold">{lastNotification.title}:</span> {lastNotification.message}
                <span className="ml-2 font-mono text-[11px] opacity-60">({lastNotification.time})</span>
              </div>
            </div>
            <button onClick={clearNotification} className="font-bold hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
            {error}
          </div>
        )}

        {/* TAB 1: SENSORS */}
        {activeTab === 'sensors' && (
          <SensorMonitor
            onAnomalyTriggered={(newInc) => {
              setIncidents((prev) => [newInc, ...prev]);
            }}
          />
        )}

        {/* TAB 2: INCIDENT QUEUE */}
        {activeTab === 'queue' && (
          <>
            {/* Filter and View Toolbar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Filter by ref code, location, or issue…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field-input py-2 pl-3 text-xs"
                />
              </div>

              {/* View Mode Toggle: List vs Map */}
              <div className="flex items-center gap-2">
                {viewMode === 'map' && (
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink/70">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded text-primary"
                    />
                    🔥 Hotspot Density
                  </label>
                )}

                <div className="flex rounded-lg border border-line bg-card p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      viewMode === 'list' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    ☰ List
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      viewMode === 'map' ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    🗺️ GIS Map
                  </button>
                </div>
              </div>
            </div>

            {/* Status Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-line bg-card text-ink/60 hover:bg-surface hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner label="Loading live queue…" />
              </div>
            ) : viewMode === 'map' ? (
              // MAP VIEW
              <div className="mt-6">
                <InteractiveMap
                  mode="viewer"
                  incidents={visible}
                  selectedIncident={selectedIncident}
                  onSelectIncident={setSelectedIncident}
                  height="540px"
                  showHeatmap={showHeatmap}
                />
              </div>
            ) : visible.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-line bg-card/50 py-16 text-center text-sm text-ink/50">
                No reports matching the selected filters.
              </div>
            ) : (
              // LIST VIEW
              <div className="mt-6 flex flex-col gap-4">
                {visible.map((incident) => {
                  const ref = incident.referenceCode || incident.reference_code;
                  const issue = incident.issueType || incident.issue_type;
                  const image = incident.imageUrl || incident.image_url;
                  const assignedTo = incident.assignedTo ?? incident.assigned_to;
                  const assignedWorker = fieldWorkers.find((w) => w.id === assignedTo);

                  return (
                    <div
                      key={incident.id}
                      className="card border border-line bg-card shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Photo Thumbnail if uploaded */}
                          {image ? (
                            <div
                              onClick={() => setLightboxImage(image)}
                              className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line bg-surface"
                            >
                              <img
                                src={image}
                                alt="Damage preview"
                                className="h-full w-full object-cover transition group-hover:scale-110"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100 text-white text-xs">
                                🔍
                              </span>
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface text-2xl">
                              {issue === 'leak' ? '💧' : issue === 'contamination' ? '☣' : issue === 'flooding' ? '🌊' : '⚠️'}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="ref-code text-xs font-bold text-primary-dark">
                                {ref}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  incident.severity === 'critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : incident.severity === 'urgent'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-surface text-ink/60'
                                }`}
                              >
                                {incident.severity}
                              </span>
                            </div>

                            <h2 className="mt-1 font-display text-lg font-bold capitalize text-ink">
                              {(issue || '').replace(/_/g, ' ')}
                            </h2>
                            <p className="text-xs text-ink/70">📍 {incident.location}</p>

                            {incident.description && (
                              <p className="mt-1.5 text-xs text-ink/60 line-clamp-2">
                                {incident.description}
                              </p>
                            )}

                            {incident.contactPhone && (
                              <p className="mt-1 text-[11px] text-ink/50">
                                📞 Callback: {incident.contactPhone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status & Crew Assignment */}
                        <div className="flex flex-col items-end gap-3">
                          <StatusBadge status={incident.status} />

                          {/* Crew Dispatch Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-ink/50">Crew:</span>
                            <select
                              className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-primary focus:outline-none"
                              value={assignedTo || ''}
                              disabled={assigningId === incident.id}
                              onChange={(e) => assign(incident.id, e.target.value)}
                            >
                              <option value="">Select field crew…</option>
                              {fieldWorkers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                  {worker.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {assignedWorker && (
                            <span className="text-[11px] font-medium text-primary">
                              En route: {assignedWorker.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Lightbox Photo Preview Modal */}
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
            <img src={lightboxImage} alt="Damage Full Evidence" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
