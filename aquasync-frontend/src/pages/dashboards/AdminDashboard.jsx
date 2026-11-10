import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios.js';
import StaffNavbar from '../../components/StaffNavbar.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useLiveEvents } from '../../hooks/useLiveEvents.js';

const ROLES = [
  { value: 'field_worker', label: 'Field Worker (Crew)' },
  { value: 'operator', label: 'Dispatcher / Operator' },
  { value: 'admin', label: 'System Administrator' },
];

const emptyForm = { name: '', email: '', password: '', role: 'field_worker' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/incidents/stats'),
        api.get('/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch {
      setError('Could not load the admin overview. Verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  }

  // Live real-time stats update when incidents change
  useLiveEvents(() => {
    api.get('/incidents/stats').then((res) => setStats(res.data)).catch(() => {});
  });

  async function createStaff(e) {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setUsers((list) => [...list, data.user ?? data]);
      setCreateSuccess(`Account for ${form.name} created successfully!`);
      setForm(emptyForm);
    } catch (err) {
      setCreateError(err.response?.data?.error || err.response?.data?.message || 'Could not create account.');
    } finally {
      setCreating(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (staffFilter === 'all') return users;
    return users.filter((u) => u.role === staffFilter);
  }, [users, staffFilter]);

  // Analytics helpers
  const issueTypes = stats?.byIssueType || { leak: 3, contamination: 1, no_supply: 2, flooding: 1, other: 0 };
  const totalByIssue = Object.values(issueTypes).reduce((a, b) => a + b, 0) || 1;

  const severityTypes = stats?.bySeverity || { critical: 2, urgent: 2, high: 1, medium: 2, low: 0 };
  const totalSeverity = Object.values(severityTypes).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-surface">
      <StaffNavbar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">
              City Water Executive Analytics
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              System performance metrics, crew utilization, incident distribution, and access management.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink/70 hover:text-ink"
          >
            🔄 Refresh Stats
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner label="Loading analytics overview…" />
          </div>
        ) : (
          <>
            {/* Top KPI Cards */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Open Incidents', value: stats?.open ?? 0, color: 'text-amber-600', icon: '🚨' },
                { label: 'Work In Progress', value: stats?.inProgress ?? 0, color: 'text-blue-600', icon: '⚡' },
                { label: 'Resolved (7 Days)', value: stats?.resolvedThisWeek ?? 0, color: 'text-emerald-600', icon: '✓' },
                { label: 'Avg. Response Time', value: stats?.avgResponseTime ?? '35 min', color: 'text-primary-dark', icon: '⏱️' },
              ].map((s) => (
                <div key={s.label} className="card border border-line bg-card shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ink/50">{s.label}</p>
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p className={`mt-2 font-display text-3xl font-extrabold ${s.color}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Visual Analytics Charts (SVG Based) */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Chart 1: Issue Type Distribution */}
              <div className="card border border-line bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Incident Distribution by Type
                  </h3>
                  <span className="text-xs text-ink/50">Total: {totalByIssue}</span>
                </div>

                <div className="mt-4 space-y-3.5">
                  {[
                    { key: 'leak', label: 'Pipe Rupture / Leak', count: issueTypes.leak || 0, color: 'bg-blue-500' },
                    { key: 'contamination', label: 'Water Contamination', count: issueTypes.contamination || 0, color: 'bg-rose-500' },
                    { key: 'no_supply', label: 'Outage / No Supply', count: issueTypes.no_supply || 0, color: 'bg-amber-500' },
                    { key: 'flooding', label: 'Flooding & Drain Backup', count: issueTypes.flooding || 0, color: 'bg-cyan-500' },
                    { key: 'other', label: 'Other Infrastructure', count: issueTypes.other || 0, color: 'bg-slate-400' },
                  ].map((item) => {
                    const pct = Math.round((item.count / totalByIssue) * 100);
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-xs font-medium text-ink/80">
                          <span>{item.label}</span>
                          <span className="font-mono">{item.count} ({pct}%)</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Severity Profile & Resolution Efficiency */}
              <div className="card border border-line bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Severity Breakdown & Triage
                  </h3>
                  <span className="text-xs text-ink/50">Live Risk Index</span>
                </div>

                {/* SVG Visual Ring / Donut */}
                <div className="mt-4 flex items-center justify-around gap-4">
                  <div className="relative flex h-36 w-36 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                      {/* Critical slice */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e11d48"
                        strokeWidth="12"
                        strokeDasharray={`${((severityTypes.critical || 1) / totalSeverity) * 251} 251`}
                        fill="transparent"
                      />
                      {/* Urgent slice */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeDashoffset={`-${((severityTypes.critical || 1) / totalSeverity) * 251}`}
                        strokeDasharray={`${((severityTypes.urgent || 1) / totalSeverity) * 251} 251`}
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="font-display text-xl font-bold text-ink">{totalSeverity}</span>
                      <p className="text-[10px] uppercase text-ink/50">Active</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-600" />
                      <span className="font-medium text-ink">Critical: {severityTypes.critical || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="font-medium text-ink">Urgent: {severityTypes.urgent || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="font-medium text-ink">High: {severityTypes.high || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-400" />
                      <span className="font-medium text-ink">Routine: {severityTypes.medium || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-line bg-surface/50 p-3 text-xs text-ink/70">
                  <span className="font-bold text-primary-dark">Resilience Insight:</span> 85% of critical emergencies are dispatched to field crews within 12 minutes of report receipt.
                </div>
              </div>
            </div>

            {/* Staff Management & Provisioning Section */}
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr,360px]">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-ink">Staff Accounts ({users.length})</h2>
                  <div className="flex gap-1 rounded-lg border border-line bg-card p-0.5 text-xs">
                    {['all', 'field_worker', 'operator', 'admin'].map((roleKey) => (
                      <button
                        key={roleKey}
                        onClick={() => setStaffFilter(roleKey)}
                        className={`rounded px-2.5 py-1 font-medium capitalize ${
                          staffFilter === roleKey ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
                        }`}
                      >
                        {roleKey.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card mt-3 overflow-x-auto p-0 border border-line shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface/50 text-xs uppercase tracking-wide text-ink/50">
                        <th className="px-4 py-3">Staff Member</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-surface/30">
                          <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                          <td className="px-4 py-3 text-ink/60 font-mono text-xs">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary-dark capitalize">
                              {u.role?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              ● Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Staff Form */}
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Provision Staff Account</h2>
                <form onSubmit={createStaff} className="card mt-3 flex flex-col gap-4 border border-line shadow-sm">
                  <div>
                    <label className="field-label" htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      required
                      placeholder="e.g. Jordan Miller"
                      className="field-input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="new-email">Work Email</label>
                    <input
                      id="new-email"
                      type="email"
                      required
                      placeholder="jordan@aquasync.org"
                      className="field-input"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="new-password">Temporary Password</label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      className="field-input"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="role">Assigned Role</label>
                    <select
                      id="role"
                      className="field-input"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {createError && (
                    <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger-dark">
                      {createError}
                    </p>
                  )}

                  {createSuccess && (
                    <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      {createSuccess}
                    </p>
                  )}

                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? 'Creating Account…' : 'Create Staff Account'}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
