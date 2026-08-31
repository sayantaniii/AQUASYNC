const STYLES = {
  reported: 'bg-accent/15 text-accent-dark border-accent/40',
  assigned: 'bg-primary/10 text-primary-dark border-primary/30',
  in_progress: 'bg-primary/10 text-primary-dark border-primary/30',
  resolved: 'bg-primary/15 text-primary-dark border-primary/40',
  urgent: 'bg-danger/10 text-danger-dark border-danger/30',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-ink/5 text-ink/70 border-line';
  const label = (status || 'unknown').replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wide ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
