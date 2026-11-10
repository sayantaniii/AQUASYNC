import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import InteractiveMap from '../components/InteractiveMap.jsx';

const ISSUE_TYPES = [
  { value: 'leak', label: 'Leak / Burst Pipe', icon: '💧' },
  { value: 'contamination', label: 'Contaminated Water', icon: '☣' },
  { value: 'no_supply', label: 'No Water Supply', icon: '🚰' },
  { value: 'flooding', label: 'Flooding / Backup', icon: '🌊' },
  { value: 'other', label: 'Something Else', icon: '⚠️' },
];

const initialForm = {
  issueType: '',
  location: '',
  description: '',
  severity: 'urgent',
  contactPhone: '',
  imageUrl: null,
};

export default function ReportIncident() {
  const [form, setForm] = useState(initialForm);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(true);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Please choose an image under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      update('imageUrl', reader.result);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoPreview(null);
    update('imageUrl', null);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location sharing — use the map or type your address.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        if (!form.location) {
          update('location', `GPS Pinned Location (${c.lat.toFixed(4)}, ${c.lng.toFixed(4)})`);
        }
        setLocating(false);
      },
      () => {
        setError("Couldn't get your GPS coordinates — click on the map to pin your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.issueType) {
      setError('Please select the type of water issue.');
      return;
    }

    if (!form.location.trim() && !coords) {
      setError('Please enter a location or pin it on the map so crews can locate it.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/incidents', {
        ...form,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Could not send your report. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const refCode = result?.referenceCode || result?.reference_code;

  if (result) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <div className="card w-full border border-line bg-card shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Incident Report Dispatched
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            Emergency crews and dispatchers have received your report in real time.
            Save your reference code to check live status updates without an account.
          </p>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <span className="text-xs uppercase tracking-wider text-ink/50">Your Reference Code</span>
            <p className="ref-code mt-1 text-3xl font-extrabold tracking-wider text-primary-dark">
              {refCode}
            </p>
          </div>

          {result.imageUrl && (
            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              <img src={result.imageUrl} alt="Attached evidence" className="h-32 w-full object-cover" />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/track/${refCode}`} className="btn-primary">
              Track Status Live →
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm(initialForm);
                setCoords(null);
                setPhotoPreview(null);
              }}
              className="btn-ghost"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-extrabold text-primary-dark">AquaSync</span>
          <div className="flex items-center gap-5 font-display text-sm font-medium">
            <Link to="/track" className="text-ink/70 transition hover:text-ink">
              Track a report
            </Link>
            <Link to="/helplines" className="text-ink/70 transition hover:text-ink">
              Helplines
            </Link>
            <Link
              to="/staff/login"
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-line hover:text-ink"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              ● Public Emergency Surface · No Login Required
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Report a Water Emergency
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink/70">
              Submit water leaks, contamination, outages, or flooding with exact GPS coordinates and photo evidence.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-6 shadow-sm">
          {/* Issue Type Selection */}
          <fieldset>
            <legend className="field-label">1. What type of water issue is occurring?</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ISSUE_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => update('issueType', t.value)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                    form.issueType === t.value
                      ? 'border-primary bg-primary/10 text-primary-dark ring-2 ring-primary/20'
                      : 'border-line bg-card text-ink/80 hover:border-primary/40'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Interactive GIS Location & Pin Dropper */}
          <div>
            <div className="flex items-center justify-between">
              <label className="field-label" htmlFor="location">
                2. Where is it located?
              </label>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {showMapPicker ? 'Hide Interactive Map' : '🗺️ Open Pin Dropper Map'}
              </button>
            </div>

            {showMapPicker && (
              <div className="mb-3 mt-1.5">
                <InteractiveMap
                  mode="picker"
                  selectedCoords={coords}
                  onSelectCoords={(selected) => {
                    setCoords({ lat: selected.lat, lng: selected.lng });
                    if (selected.address) update('location', selected.address);
                    else if (!form.location) {
                      update('location', `Sector Pinned (${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)})`);
                    }
                  }}
                  height="260px"
                />
              </div>
            )}

            <div className="flex gap-2">
              <input
                id="location"
                className="field-input"
                placeholder="Street address, landmark, or click on the map above"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
              />
              <button
                type="button"
                onClick={useMyLocation}
                className="btn-ghost shrink-0 px-4 text-xs font-semibold"
                disabled={locating}
              >
                {locating ? 'Locating…' : coords ? 'GPS Locked ✓' : '📍 Auto GPS'}
              </button>
            </div>
          </div>

          {/* Photo / Media Evidence Upload */}
          <div>
            <label className="field-label">3. Photo Evidence (Optional but recommended)</label>
            <p className="mb-2 text-xs text-ink/60">
              Attach a photo of the leak, murky water, or flooding to assist the response crew.
            </p>

            {photoPreview ? (
              <div className="relative mt-2 inline-block overflow-hidden rounded-xl border border-line bg-surface">
                <img src={photoPreview} alt="Preview" className="h-44 w-auto object-cover sm:h-52" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white shadow-md hover:bg-black"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface/50 p-6 transition hover:border-primary/50 hover:bg-surface">
                <span className="text-3xl">📷</span>
                <span className="mt-2 text-xs font-semibold text-ink">
                  Click or drag photo here to upload
                </span>
                <span className="text-[11px] text-ink/50">PNG, JPG, or WEBP up to 8MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="field-label" htmlFor="description">
              4. Additional Details (Optional)
            </label>
            <textarea
              id="description"
              className="field-input min-h-20"
              placeholder="E.g. water gushing across traffic lane, chemical smell, approximate water depth…"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          {/* Severity */}
          <fieldset>
            <legend className="field-label">5. Urgency Level</legend>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'urgent', label: 'Urgent', hint: 'Active danger / road flooding' },
                { value: 'high', label: 'High Priority', hint: 'No supply / murky water' },
                { value: 'medium', label: 'Routine', hint: 'Minor drip / low pressure' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => update('severity', s.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    form.severity === s.value
                      ? 'border-accent bg-accent/10 ring-2 ring-accent/20'
                      : 'border-line bg-card hover:border-accent/40'
                  }`}
                >
                  <p className="font-display text-sm font-bold text-ink">{s.label}</p>
                  <p className="text-[11px] text-ink/50">{s.hint}</p>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Contact Phone */}
          <div>
            <label className="field-label" htmlFor="phone">
              6. Callback Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              className="field-input"
              placeholder="e.g. +1 555-019-2834 (only if you want direct crew SMS updates)"
              value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
              {error}
            </p>
          )}

          <button type="submit" className="btn-accent w-full py-3.5 text-base shadow-md" disabled={submitting}>
            {submitting ? 'Transmitting Report to Dispatch…' : '🚨 Dispatch Incident Report Now'}
          </button>
        </form>
      </main>
    </div>
  );
}
