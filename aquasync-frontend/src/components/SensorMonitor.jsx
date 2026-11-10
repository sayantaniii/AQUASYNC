import { useState, useEffect } from 'react';
import api from '../api/axios.js';

export default function SensorMonitor({ onAnomalyTriggered }) {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 6000);
    return () => clearInterval(interval);
  }, []);

  async function fetchSensors() {
    try {
      const { data } = await api.get('/sensors');
      setSensors(data);
    } catch (err) {
      console.warn('Could not fetch sensors:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate(type = 'burst') {
    setSimulating(true);
    setFeedback(null);
    try {
      const { data } = await api.post('/sensors/simulate', {
        sensorId: type === 'burst' ? 1 : 2,
        type,
      });
      setFeedback({
        type: 'alert',
        text: `⚠️ Telemetry Anomaly Injected! Sensor ${data.sensor?.code} triggered an automatic high-priority incident (${data.incident?.referenceCode}).`,
      });
      fetchSensors();
      if (onAnomalyTriggered) onAnomalyTriggered(data.incident);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to simulate sensor event.' });
    } finally {
      setSimulating(false);
    }
  }

  async function handleReset() {
    setSimulating(true);
    try {
      await api.post('/sensors/reset');
      setFeedback({ type: 'success', text: 'All sensors recalibrated to nominal baseline values.' });
      fetchSensors();
    } catch {
      setFeedback({ type: 'error', text: 'Could not reset sensors.' });
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="card mt-6 border-line bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display text-lg font-bold">IoT Water Telemetry Network</h3>
          </div>
          <p className="mt-0.5 text-xs text-ink/60">
            Real-time pressure, flow, and turbidity sensors monitoring municipal water lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulate('burst')}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          >
            💥 Simulate Pipe Burst
          </button>
          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulate('contamination')}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            ☣ Simulate Contamination
          </button>
          <button
            type="button"
            disabled={simulating}
            onClick={handleReset}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-card hover:text-ink"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 rounded-lg px-4 py-2.5 text-xs font-medium ${
            feedback.type === 'alert'
              ? 'border border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200'
              : feedback.type === 'success'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'border border-danger/30 bg-danger/5 text-danger-dark'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-ink/50">Streaming sensor telemetry…</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sensors.map((sensor) => {
            const isDanger = sensor.status === 'critical';
            const isWarning = sensor.status === 'warning';

            return (
              <div
                key={sensor.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isDanger
                    ? 'border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-500/60 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-line bg-surface/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="ref-code text-[11px] font-semibold text-ink/50">
                      {sensor.code}
                    </span>
                    <h4 className="font-display text-sm font-bold text-ink">{sensor.name}</h4>
                    <p className="text-[11px] text-ink/60">{sensor.location}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      isDanger
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {sensor.status}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl font-black text-ink">
                      {sensor.current_value}
                    </span>
                    <span className="text-xs font-semibold text-ink/60">{sensor.unit}</span>
                  </div>
                  <div className="text-right text-[11px] text-ink/50">
                    Safe: {sensor.min_normal} - {sensor.max_normal} {sensor.unit}
                  </div>
                </div>

                {/* Range progress bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, ((sensor.current_value - sensor.min_normal * 0.5) / (sensor.max_normal * 1.5 - sensor.min_normal * 0.5)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
