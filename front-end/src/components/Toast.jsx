import { useEffect } from 'react';

const VISIBLE_MS = 3500;

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDone, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, onDone]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && <div className="toast" key={toast.id}>{toast.message}</div>}
    </div>
  );
}
