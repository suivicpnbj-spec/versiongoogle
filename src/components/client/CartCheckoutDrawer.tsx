import React, { useMemo, useState } from 'react';
import {
  Clock,
  Minus,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { BRAND_CONFIG, formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { PARAKOU_NEIGHBORHOODS } from '../../data/parakouSeed';
import { DeliveryLocation, FulfillmentMode } from '../../types/domain';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';

export const CartCheckoutDrawer: React.FC = () => {
  const {
    state,
    cart,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeCartLine,
    clearMerchantCart,
    placeOrder,
    notify,
  } = useApp();

  const [checkoutEstId, setCheckoutEstId] = useState<string | null>(null);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('livraison');
  const [paymentMethod, setPaymentMethod] = useState<'momo_demo' | 'moov_demo' | 'cash_demo'>(
    'momo_demo'
  );
  const [customerName, setCustomerName] = useState(state.customerProfile.name);
  const [customerPhone, setCustomerPhone] = useState(state.customerProfile.phone);
  const [formError, setFormError] = useState('');

  const initialLocation: DeliveryLocation = useMemo(
    () =>
      state.customerProfile.savedAddresses[0]?.location ?? {
        coordinates: PARAKOU_NEIGHBORHOODS[1].coordinates,
        neighborhood: 'Albarika',
        textAddress: 'Albarika, 2e ruelle après la pharmacie',
        accessInstructions: 'Portail vert, appeler à l’arrivée devant la cour.',
        threeWordCode: '///carrefour.karite.portail',
        gpsSource: 'preset',
      },
    [state.customerProfile.savedAddresses]
  );

  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(initialLocation);

  const groupedByMerchant = useMemo(() => {
    const map = new Map<string, typeof cart>();
    for (const item of cart) {
      const list = map.get(item.establishmentId) ?? [];
      list.push(item);
      map.set(item.establishmentId, list);
    }
    return Array.from(map.entries()).map(([estId, items]) => {
      const establishment = state.establishments.find((e) => e.id === estId);
      const subtotal = items.reduce((s, i) => s + i.unitPriceFcfa * i.quantity, 0);
      return { estId, establishment, items, subtotal };
    });
  }, [cart, state.establishments]);

  if (!cartOpen) return null;

  const activeMerchantGroup = groupedByMerchant.find((g) => g.estId === checkoutEstId);

  const startCheckoutFor = (estId: string) => {
    const est = state.establishments.find((e) => e.id === estId);
    setCheckoutEstId(estId);
    setFormError('');
    if (est?.supportsDelivery) setFulfillmentMode('livraison');
    else if (est?.supportsPickup) setFulfillmentMode('retrait');
    else setFulfillmentMode('sur_place');
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMerchantGroup) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }
    if (
      fulfillmentMode === 'livraison' &&
      !deliveryLocation.textAddress.trim()
    ) {
      setFormError('Veuillez préciser l’adresse textuelle ou un repère pour la livraison.');
      return;
    }

    placeOrder({
      establishmentId: activeMerchantGroup.estId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      fulfillmentMode,
      location: fulfillmentMode === 'livraison' ? deliveryLocation : undefined,
      paymentMethod,
    });
    setCheckoutEstId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Panier et commande"
    >
      <div className="bg-[#F8F9FA] w-full max-w-xl h-full flex flex-col border-l border-slate-200 shadow-2xl">
        <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              {activeMerchantGroup ? 'Finaliser la commande' : `Votre panier (${cart.reduce((s, i) => s + i.quantity, 0)})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setCheckoutEstId(null);
              setCartOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {cart.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <p className="text-base font-semibold text-slate-900">
                Votre panier est vide.
              </p>
              <p className="text-sm text-slate-600">
                Comparez les prix des produits de Parakou ou parcourez les restaurants et commerces pour ajouter des articles.
              </p>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="h-11 px-4 rounded-xl bg-teal-700 text-white text-sm font-medium cursor-pointer"
              >
                Explorer les commerces
              </button>
            </div>
          ) : activeMerchantGroup && activeMerchantGroup.establishment ? (
            <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCheckoutEstId(null)}
                  className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  ← Revenir à la liste du panier
                </button>
                <span className="text-xs text-slate-500">
                  {activeMerchantGroup.establishment.neighborhood}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activeMerchantGroup.establishment.name}
                </h3>
                {activeMerchantGroup.establishment.prepTimeMin && (
                  <p className="text-xs text-teal-800 inline-flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Temps de préparation estimé : ~
                      {activeMerchantGroup.establishment.prepTimeMin} min
                    </span>
                  </p>
                )}
                <div className="divide-y divide-slate-100 pt-2">
                  {activeMerchantGroup.items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.quantity} × {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.packagingLabel}
                          {item.selectedOptions.length > 0 &&
                            ` · ${item.selectedOptions.map((o) => o.label).join(', ')}`}
                        </p>
                      </div>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {formatFcfa(item.unitPriceFcfa * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                  {formError}
                </div>
              )}

              {/* Mode de réception */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-700">
                  Mode de réception souhaité
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeMerchantGroup.establishment.supportsDelivery && (
                    <button
                      type="button"
                      onClick={() => setFulfillmentMode('livraison')}
                      className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        fulfillmentMode === 'livraison'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Livraison (+500 F)
                    </button>
                  )}
                  {activeMerchantGroup.establishment.supportsPickup && (
                    <button
                      type="button"
                      onClick={() => setFulfillmentMode('retrait')}
                      className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        fulfillmentMode === 'retrait'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Retrait sur place
                    </button>
                  )}
                  {activeMerchantGroup.establishment.supportsDineIn && (
                    <button
                      type="button"
                      onClick={() => setFulfillmentMode('sur_place')}
                      className={`h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                        fulfillmentMode === 'sur_place'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Sur place
                    </button>
                  )}
                </div>
              </div>

              {/* Coordonnées client */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-11 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Localisation exacte si livraison */}
              {fulfillmentMode === 'livraison' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Lieu exact de livraison à Parakou
                    </h4>
                    <p className="text-xs text-slate-600">
                      Positionnez votre maison ou ruelle sur la carte afin que le livreur arrive sans vous faire sortir sur une grande voie.
                    </p>
                  </div>
                  <ParakouInteractiveMap
                    compact
                    editable
                    location={deliveryLocation}
                    onChange={setDeliveryLocation}
                    originCoordinates={activeMerchantGroup.establishment.coordinates}
                    originLabel={activeMerchantGroup.establishment.name}
                    destinationLabel="Votre point exact"
                    savedAddresses={state.customerProfile.savedAddresses}
                    onNotify={notify}
                  />
                </div>
              )}

              {/* Paiement de démonstration */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{BRAND_CONFIG.paymentDemoNotice}</span>
                </div>

                <p className="text-xs font-semibold text-slate-700">
                  Mode de règlement (démonstration)
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'momo_demo' as const, label: 'MTN MoMo (Simulation démo)' },
                    { id: 'moov_demo' as const, label: 'Moov Money (Simulation démo)' },
                    { id: 'cash_demo' as const, label: 'Espèces à la réception (Démo)' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-sm ${
                        paymentMethod === m.id
                          ? 'border-teal-700 bg-teal-50/40 font-medium text-slate-900'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="demo-payment"
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="text-teal-700 focus:ring-teal-700"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {groupedByMerchant.map(({ estId, establishment, items, subtotal }) => (
                <section
                  key={estId}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {establishment?.name ?? 'Commerce'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {establishment?.neighborhood}
                        {establishment?.prepTimeMin
                          ? ` · Prép. ~${establishment.prepTimeMin} min`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearMerchantCart(estId)}
                      className="text-xs text-slate-500 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vider</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.packagingLabel} · {formatFcfa(item.unitPriceFcfa)} / unité
                          </p>
                          {item.selectedOptions.length > 0 && (
                            <p className="text-xs text-teal-800 mt-0.5">
                              {item.selectedOptions.map((o) => o.label).join(', ')}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs text-slate-500 italic mt-0.5">
                              Note : {item.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="inline-flex items-center border border-slate-200 rounded-xl">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                              aria-label="Réduire"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                              aria-label="Augmenter"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartLine(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 cursor-pointer"
                            aria-label="Supprimer l'article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Sous-total articles</p>
                      <p className="text-base font-bold text-slate-900 font-mono-tabular">
                        {formatFcfa(subtotal)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCheckoutFor(estId)}
                      className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium cursor-pointer"
                    >
                      Commander ici
                    </button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {activeMerchantGroup && (
          <footer className="bg-white border-t border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Total ({fulfillmentMode === 'livraison' ? 'livraison 500 FCFA incluse' : 'sans frais de livraison'})
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono-tabular">
                {formatFcfa(
                  activeMerchantGroup.subtotal +
                    (fulfillmentMode === 'livraison' ? 500 : 0)
                )}
              </span>
            </div>
            <button
              type="submit"
              form="checkout-form"
              className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer transition-colors"
            >
              Confirmer la commande (démo)
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
