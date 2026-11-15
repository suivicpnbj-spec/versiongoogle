import React from 'react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import {
  DeliveryStatusLabel,
  InterventionStatusLabel,
  PrepStatusLabel,
} from '../ui/StatusText';

export const ActivityHistoryView: React.FC = () => {
  const { state, setClientTab } = useApp();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Historique des activités
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Retrouvez l’ensemble de vos commandes passées et demandes d’intervention à Parakou.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Commandes ({state.orders.length})
          </h2>
          <button
            type="button"
            onClick={() => setClientTab('tracking')}
            className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
          >
            Ouvrir le suivi en direct
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {state.orders.map((ord) => (
            <div
              key={ord.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono-tabular font-semibold text-slate-800">
                    {ord.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(ord.createdAt).toLocaleString('fr-FR')}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {ord.establishmentName}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <PrepStatusLabel status={ord.prepStatus} />
                  <DeliveryStatusLabel status={ord.deliveryStatus} />
                </div>
              </div>
              <p className="text-base font-bold text-slate-900 font-mono-tabular shrink-0">
                {formatFcfa(ord.totalFcfa)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Demandes d’intervention ({state.interventions.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {state.interventions.map((intv) => (
            <div
              key={intv.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono-tabular font-semibold text-slate-800">
                    {intv.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{intv.specialtyLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{intv.location.neighborhood}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{intv.proName}</p>
                <p className="text-xs text-slate-600">{intv.problemDescription}</p>
              </div>
              <div className="shrink-0">
                <InterventionStatusLabel status={intv.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
