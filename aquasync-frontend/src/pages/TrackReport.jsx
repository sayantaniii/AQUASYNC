import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function TrackReport() {
  const { referenceCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(referenceCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    if (referenceCode) {
      lookup(referenceCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceCode]);

  async function lookup(value) {
    setLoading(true);
    setError('');
    setIncident(null);
    try {
      const { data } = await api.get(`/incidents/track/${value.trim()}`);
      setIncident(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "We couldn't find a report with that code."
          : 'Something went wrong looking that up. Try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/track/${code.trim()}`);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-extrabold text-primary-dark">
            AquaSync
          </Link>
          <Link to="/" className="font-display text-sm text-ink/60 hover:text-ink">
            Report an issue
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-extrabold">Track a report</h1>
        <p className="mt-1 text-ink/70">Enter the code you got when you submitted your report.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            className="field-input ref-code"
            placeholder="e.g. AQ-7F3K2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-primary shrink-0" type="submit">
            Look up
          </button>
        </form>

        <div className="mt-8">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner label="Looking up your report" />
            </div>
          )}

          {!loading && error && (
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
              {error}
            </p>
          )}

          {!loading && incident && (
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ref-code text-sm text-ink/50">{incident.referenceCode}</p>
                  <h2 className="mt-1 font-display text-xl font-bold capitalize">
                    {(incident.issueType || '').replace(/_/g, ' ')}
                  </h2>
                </div>
                <StatusBadge status={incident.status} />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between border-b border-line pb-2">
                  <dt className="text-ink/50">Location</dt>
                  <dd className="text-right font-medium">{incident.location}</dd>
                </div>
                {incident.description && (
                  <div className="border-b border-line pb-2">
                    <dt className="text-ink/50">Details</dt>
                    <dd className="mt-1">{incident.description}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink/50">Reported</dt>
                  <dd className="font-mono">
                    {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
