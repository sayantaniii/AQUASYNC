import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

const ISSUE_TYPES = [
  { value: 'leak', label: 'Leak / burst pipe' },
  { value: 'contamination', label: 'Contaminated water' },
  { value: 'no_supply', label: 'No water supply' },
  { value: 'flooding', label: 'Flooding' },
  { value: 'other', label: 'Something else' },
];

const initialForm = {
  issueType: '',
  location: '',
  description: '',
  severity: 'urgent',
  contactPhone: '',
};

export default function ReportIncident() {
  const [form, setForm] = useState(initialForm);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { referenceCode }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location sharing — type the location instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — type it in below instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
   if (!form.issueType || (!form.location.trim() && !coords)) {
  setError('Pick an issue type and add a location so a crew can find it.');
  return;
}
    setSubmitting(true);
    try {
      // Public endpoint — no auth header is attached for this request.
      const { data } = await api.post('/incidents', {
        ...form,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not send your report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <div className="card w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <span className="h-3 w-3 animate-ripple rounded-full bg-primary" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-primary-dark">
            Report sent
          </h1>
          <p className="mt-2 text-ink/70">
            A dispatcher has been notified. Save this code to check the status later —
            you don't need an account.
          </p>
          <p className="ref-code mt-5 rounded-lg bg-surface px-4 py-3 text-2xl font-semibold text-primary-dark">
            {result.referenceCode}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/track/${result.referenceCode}`} className="btn-primary">
              Track this report
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm(initialForm);
                setCoords(null);
              }}
              className="btn-ghost"
            >
              Report another issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-extrabold text-primary-dark">AquaSync</span>
          <div className="flex items-center gap-4 font-display text-sm">
            <Link to="/track" className="text-ink/60 hover:text-ink">
              Track a report
            </Link>
            <Link to="/staff/login" className="text-ink/40 hover:text-ink/70">
              Staff login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          No account needed
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          Report a water issue
        </h1>
        <p className="mt-2 max-w-xl text-ink/70">
          Tell us what's happening and where. A dispatcher sees it immediately — no
          sign-up, no waiting.
        </p>

        <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-6">
          <fieldset>
            <legend className="field-label">What's the issue?</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ISSUE_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => update('issueType', t.value)}
                  className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition ${
                    form.issueType === t.value
                      ? 'border-primary bg-primary/10 text-primary-dark'
                      : 'border-line bg-white text-ink/70 hover:border-primary/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="field-label" htmlFor="location">
              Location
            </label>
            <div className="flex gap-2">
              <input
                id="location"
                className="field-input"
                placeholder="Street, landmark, or address"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
              />
              <button
                type="button"
                onClick={useMyLocation}
                className="btn-ghost shrink-0 px-4 text-sm"
                disabled={locating}
              >
                {locating ? 'Locating…' : coords ? 'Location pinned ✓' : 'Use my location'}
              </button>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="description">
              What do you see? (optional)
            </label>
            <textarea
              id="description"
              className="field-input min-h-24"
              placeholder="E.g. water gushing from a broken pipe near the bus stop"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <fieldset>
            <legend className="field-label">How urgent is it?</legend>
            <div className="flex gap-3">
              {[
                { value: 'urgent', label: 'Urgent', hint: 'Active danger / large leak' },
                { value: 'moderate', label: 'Moderate', hint: 'Needs attention today' },
                { value: 'low', label: 'Low', hint: 'Can wait' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => update('severity', s.value)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition ${
                    form.severity === s.value
                      ? 'border-accent bg-accent/10'
                      : 'border-line bg-white hover:border-accent/50'
                  }`}
                >
                  <p className="font-display text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-ink/50">{s.hint}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="field-label" htmlFor="phone">
              Phone number (optional, for updates)
            </label>
            <input
              id="phone"
              type="tel"
              className="field-input"
              placeholder="Only if you'd like a callback"
              value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
              {error}
            </p>
          )}

          <button type="submit" className="btn-accent w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send report now'}
          </button>
        </form>
      </main>
    </div>
  );
}
