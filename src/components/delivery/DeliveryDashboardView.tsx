import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Navigation,
  Package,
  Pause,
  Play,
  Store,
} from 'lucide-react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';
import { DeliveryStatusLabel, PrepStatusLabel } from '../ui/StatusText';

export const DeliveryDashboardView: React.FC = () => {
  const {
    state,
    updateDeliveryStatus,
    setOrderDriverProgress,
    liveSimulationRunning,
    setLiveSimulationRunning,
  } = useApp();

  const deliveryOrders = useMemo(
    () =>
      state.orders.filter(
        (o) => o.fulfillmentMode === 'livraison' && o.prepStatus !== 'annulee'
      ),
    [state.orders]
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    deliveryOrders[0]?.id ?? ''
  );

  const activeOrder =
    deliveryOrders.find((o) => o.id === selectedOrderId) ?? deliveryOrders[0] ?? null;

  const pickupEstablishment = activeOrder
    ? state.establishments.find((e) => e.id === activeOrder.establishmentId)
    : null;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-teal-800">
            Espace Livraison · Parakou
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Courses attribuées & guidage précis
          </h1>
          <p className="text-sm text-slate-600">
            Consultez le point de retrait, la destination exacte avec indications d’accès et simulez votre trajet en direct.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLiveSimulationRunning(!liveSimulationRunning)}
          className="h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {liveSimulationRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause simulation</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Simuler le trajet</span>
            </>
          )}
        </button>
      </section>

      {deliveryOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-600">
          Aucune livraison à effectuer pour le moment. Créez une commande avec « Livraison à domicile » dans l’espace Client.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Liste des livraisons */}
          <aside className="lg:col-span-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">
              Livraisons ({deliveryOrders.length})
            </h2>
            {deliveryOrders.map((ord) => {
              const selected = activeOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer space-y-2 ${
                    selected
                      ? 'bg-white border-teal-700 ring-1 ring-teal-700/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      {ord.id}
                    </span>
                    <span className="font-mono-tabular font-bold text-slate-900">
                      {formatFcfa(ord.totalFcfa)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {ord.establishmentName} → {ord.location?.neighborhood ?? 'Parakou'}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <DeliveryStatusLabel status={ord.deliveryStatus} />
                    <span className="text-[11px] font-mono-tabular text-slate-500">
                      {ord.driverProgress}%
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Détail de la course sélectionnée + carte + progression */}
          {activeOrder && activeOrder.location && (
            <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      {activeOrder.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <PrepStatusLabel status={activeOrder.prepStatus} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Livraison pour {activeOrder.customerName}
                  </h2>
                  <p className="text-xs text-slate-600 font-mono-tabular">
                    Tél. client : {activeOrder.customerPhone}
                  </p>
                </div>

                <DeliveryStatusLabel status={activeOrder.deliveryStatus} />
              </div>

              {/* Points Retrait vs Destination exacte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-700" />
                    <span>Point de retrait</span>
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {activeOrder.establishmentName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {pickupEstablishment?.neighborhood} — {pickupEstablishment?.address}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1.5">
                  <p className="text-xs font-semibold text-teal-900 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-700" />
                    <span>Destination exacte du client</span>
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {activeOrder.location.neighborhood} — {activeOrder.location.textAddress}
                  </p>
                  <p className="text-xs text-slate-700">
                    Indications : {activeOrder.location.accessInstructions || 'Aucune'}
                  </p>
                  <p className="text-xs font-mono-tabular text-teal-800">
                    Code 3 mots : {activeOrder.location.threeWordCode}
                  </p>
                </div>
              </div>

              {/* Carte de guidage & suivi */}
              <ParakouInteractiveMap
                location={activeOrder.location}
                originCoordinates={pickupEstablishment?.coordinates}
                originLabel={activeOrder.establishmentName}
                destinationLabel={activeOrder.customerName}
                movingProgress={activeOrder.driverProgress}
                movingLabel={activeOrder.driverName ?? 'Vous (Livreur)'}
              />

              {/* Contrôles de statut et simulation de déplacement */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label
                    htmlFor="driver-progress-range"
                    className="text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-teal-700" />
                    <span>Avancement simulé sur le trajet ({activeOrder.driverProgress}%)</span>
                  </label>
                  <input
                    id="driver-progress-range"
                    type="range"
                    min={0}
                    max={100}
                    value={activeOrder.driverProgress}
                    onChange={(e) =>
                      setOrderDriverProgress(activeOrder.id, Number(e.target.value))
                    }
                    className="w-full sm:w-56 accent-teal-700 cursor-pointer"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(activeOrder.deliveryStatus === 'en_attente_livreur' ||
                    activeOrder.deliveryStatus === 'attribuee') && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDeliveryStatus(activeOrder.id, 'en_route_retrait')
                      }
                      className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      Partir vers le point de retrait
                    </button>
                  )}

                  {activeOrder.deliveryStatus === 'en_route_retrait' && (
                    <button
                      type="button"
                      onClick={() => updateDeliveryStatus(activeOrder.id, 'en_livraison')}
                      className="h-10 px-4 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Colis récupéré — démarrer la livraison</span>
                    </button>
                  )}

                  {activeOrder.deliveryStatus === 'en_livraison' && (
                    <button
                      type="button"
                      onClick={() => updateDeliveryStatus(activeOrder.id, 'livree')}
                      className="h-10 px-4 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer la remise au client</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
