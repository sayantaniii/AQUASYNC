import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StaffNavbar from '../../components/StaffNavbar.jsx';
import Spinner from '../../components/Spinner.jsx';

const ROLES = [
  { value: 'field_worker', label: 'Field Worker' },
  { value: 'operator', label: 'Operator' },
  { value: 'admin', label: 'Admin' },
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
      setError('Could not load the admin overview.');
    } finally {
      setLoading(false);
    }
  }

  async function createStaff(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setUsers((list) => [...list, data.user ?? data]);
      setForm(emptyForm);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create that account.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <StaffNavbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-display text-2xl font-extrabold">Admin overview</h1>

        {error && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-dark">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Open reports', value: stats?.open ?? '—' },
                { label: 'In progress', value: stats?.inProgress ?? '—' },
                { label: 'Resolved (7d)', value: stats?.resolvedThisWeek ?? '—' },
                { label: 'Avg. response', value: stats?.avgResponseTime ?? '—' },
              ].map((s) => (
                <div key={s.label} className="card">
                  <p className="font-mono text-xs uppercase tracking-wide text-ink/50">{s.label}</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-primary-dark">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr,320px]">
              <div>
                <h2 className="font-display text-lg font-bold">Staff accounts</h2>
                <div className="card mt-3 overflow-x-auto p-0">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs uppercase tracking-wide text-ink/50">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-line last:border-0">
                          <td className="px-4 py-3 font-medium">{u.name}</td>
                          <td className="px-4 py-3 text-ink/60">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs uppercase text-primary-dark">
                              {u.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold">Add staff account</h2>
                <form onSubmit={createStaff} className="card mt-3 flex flex-col gap-4">
                  <div>
                    <label className="field-label" htmlFor="name">Name</label>
                    <input
                      id="name"
                      required
                      className="field-input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="new-email">Email</label>
                    <input
                      id="new-email"
                      type="email"
                      required
                      className="field-input"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="new-password">Temporary password</label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={8}
                      className="field-input"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="role">Role</label>
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

                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create account'}
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
