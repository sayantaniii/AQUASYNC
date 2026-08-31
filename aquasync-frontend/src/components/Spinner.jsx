export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center gap-3 text-ink/60">
      <div
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-primary"
        role="status"
        aria-label={label}
      />
      <span className="font-display text-sm">{label}</span>
    </div>
  );
}
