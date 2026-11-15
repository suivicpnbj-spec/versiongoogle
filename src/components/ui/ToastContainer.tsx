import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'success'
            ? CheckCircle2
            : toast.tone === 'warning'
            ? AlertTriangle
            : Info;
        const iconColor =
          toast.tone === 'success'
            ? 'text-emerald-600'
            : toast.tone === 'warning'
            ? 'text-amber-600'
            : 'text-teal-600';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-lg shadow-slate-900/5 text-sm text-slate-800"
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
            <p className="flex-1 leading-snug">{toast.text}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 -m-1"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
