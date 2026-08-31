export default function LoadingSpinner() {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <span>Syncing…</span>
    </div>
  );
}
