import React from 'react';
import { Clock, MapPin, Navigation, Pause, Play, Wrench } from 'lucide-react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';
import {
  DeliveryStatusLabel,
  InterventionStatusLabel,
  PaymentStatusLabel,
  PrepStatusLabel,
} from '../ui/StatusText';

export const OrderTrackingView: React.FC = () => {
  const {
    state,
    liveSimulationRunning,
    setLiveSimulationRunning,
    setWorkspace,
    setClientTab,
  } = useApp();

  const activeOrders = state.orders.filter((o) => o.prepStatus !== 'annulee');
  const activeInterventions = state.interventions.filter(
    (i) => i.status !== 'refusee'
  );

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#e7e6dd] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#17211c]">
            Suivi des commandes et interventions
          </h1>
          <p className="text-sm text-[#65736b]">
            Suivez séparément la préparation, le paiement de démonstration et le déplacement en temps réel sur Parakou.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLiveSimulationRunning(!liveSimulationRunning)}
          className="h-11 px-4 rounded-xl border border-[#e7e6dd] bg-[#f5f3ed] hover:bg-[#eeede6] text-sm font-medium text-[#26352d] inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {liveSimulationRunning ? (
            <>
              <Pause className="w-4 h-4 text-[#0b5d41]" />
              <span>Mettre en pause la simulation</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-[#0b5d41]" />
              <span>Reprendre la simulation trajet</span>
            </>
          )}
        </button>
      </div>

      {/* Section Commandes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#17211c]">
            Commandes ({activeOrders.length})
          </h2>
          <button
            type="button"
            onClick={() => setWorkspace('delivery')}
            className="text-xs font-medium text-[#0b5d41] hover:text-[#084b35] cursor-pointer"
          >
            Tester côté Espace Livreur →
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white border border-[#e7e6dd] rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#26352d]">
              Aucune commande active pour le moment.
            </p>
            <button
              type="button"
              onClick={() => setClientTab('discover')}
              className="h-10 px-4 rounded-xl bg-[#0b5d41] text-white text-sm font-medium cursor-pointer"
            >
              Découvrir les commerces et restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {activeOrders.map((order) => {
              const est = state.establishments.find(
                (e) => e.id === order.establishmentId
              );
              const showLiveMap =
                order.fulfillmentMode === 'livraison' && order.location;

              return (
                <article
                  key={order.id}
                  className="bg-white border border-[#e7e6dd] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eeede6]">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#829087]">
                        <span className="font-mono-tabular font-semibold text-[#17211c]">
                          {order.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {order.fulfillmentMode === 'livraison'
                            ? 'Livraison à domicile'
                            : order.fulfillmentMode === 'retrait'
                            ? 'Retrait sur place'
                            : 'Consommation sur place'}
                        </span>
                        {order.estimatedPrepMin && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Prép. ~{order.estimatedPrepMin} min
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#17211c] mt-1">
                        {order.establishmentName}
                      </h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-[#17211c] font-mono-tabular">
                        {formatFcfa(order.totalFcfa)}
                      </p>
                      <p className="text-xs text-[#829087]">{order.paymentMethodLabel}</p>
                    </div>
                  </div>

                  {/* Distinction claire des 3 états : Préparation, Paiement, Livraison */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f5f3ed] rounded-xl p-3.5">
                    <div>
                      <p className="text-[11px] text-[#829087] mb-1">Préparation</p>
                      <PrepStatusLabel status={order.prepStatus} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#829087] mb-1">Paiement</p>
                      <PaymentStatusLabel status={order.paymentStatus} />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#829087] mb-1">Acheminement</p>
                      <DeliveryStatusLabel status={order.deliveryStatus} />
                    </div>
                  </div>

                  <div className="text-sm text-[#405047] space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.quantity} × {item.productName} ({item.packagingLabel})
                        </span>
                        <span className="font-mono-tabular">
                          {formatFcfa(item.unitPriceFcfa * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {showLiveMap && order.location && (
                    <div className="pt-2">
                      <ParakouInteractiveMap
                        compact
                        location={order.location}
                        originCoordinates={est?.coordinates}
                        originLabel={order.establishmentName}
                        destinationLabel={order.customerName}
                        movingProgress={
                          order.deliveryStatus === 'en_livraison' ||
                          order.deliveryStatus === 'livree'
                            ? order.driverProgress
                            : undefined
                        }
                        movingLabel={order.driverName ?? 'Livreur en route'}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section Interventions Professionnels */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#17211c]">
            Demandes d’intervention ({activeInterventions.length})
          </h2>
          <button
            type="button"
            onClick={() => setWorkspace('pro')}
            className="text-xs font-medium text-[#0b5d41] hover:text-[#084b35] cursor-pointer"
          >
            Répondre côté Espace Pro →
          </button>
        </div>

        {activeInterventions.length === 0 ? (
          <div className="bg-white border border-[#e7e6dd] rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#26352d]">
              Aucune demande d’intervention en cours.
            </p>
            <button
              type="button"
              onClick={() => setClientTab('services')}
              className="h-10 px-4 rounded-xl bg-[#0b5d41] text-white text-sm font-medium cursor-pointer"
            >
              Trouver un professionnel
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {activeInterventions.map((intv) => {
              const pro = state.pros.find((p) => p.id === intv.proId);
              return (
                <article
                  key={intv.id}
                  className="bg-white border border-[#e7e6dd] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eeede6]">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#829087]">
                        <span className="font-mono-tabular font-semibold text-[#17211c]">
                          {intv.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{intv.specialtyLabel}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#17211c] mt-1 inline-flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#0b5d41]" />
                        <span>{intv.proName}</span>
                      </h3>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      <InterventionStatusLabel status={intv.status} />
                      {intv.estimatedArrivalMin && intv.status === 'en_route' && (
                        <span className="text-xs text-[#65736b] tabular-nums">
                          Arrivée estimée : ~{intv.estimatedArrivalMin} min
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[#405047]">
                    <span className="font-medium text-[#17211c]">Besoin : </span>
                    {intv.problemDescription}
                  </p>

                  {intv.proNote && (
                    <p className="text-xs text-[#0b5d41] bg-teal-50/70 border border-teal-200 rounded-xl px-3.5 py-2.5">
                      Message du professionnel : {intv.proNote}
                    </p>
                  )}

                  <ParakouInteractiveMap
                    compact
                    location={intv.location}
                    originCoordinates={pro?.coordinates}
                    originLabel={intv.proName}
                    destinationLabel="Lieu d’intervention"
                    movingProgress={
                      intv.status === 'en_route' ||
                      intv.status === 'sur_place' ||
                      intv.status === 'terminee'
                        ? intv.proProgress
                        : undefined
                    }
                    movingLabel={`${intv.proName} en route`}
                  />

                  <div className="flex items-center justify-between text-xs text-[#829087] pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {intv.location.neighborhood}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#0b5d41]" />
                      Mise à jour automatique active
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
