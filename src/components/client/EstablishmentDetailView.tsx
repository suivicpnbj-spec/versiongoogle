import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { CATEGORY_LABELS, generateDemoThreeWordCode } from '../../data/parakouSeed';
import { DishOption, ProductOffer } from '../../types/domain';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';
import { ResilientImage } from '../ui/ResilientImage';

export const EstablishmentDetailView: React.FC = () => {
  const {
    state,
    selectedEstablishmentId,
    openEstablishment,
    addToCart,
    setCartOpen,
  } = useApp();

  const establishment = useMemo(
    () => state.establishments.find((e) => e.id === selectedEstablishmentId) ?? null,
    [selectedEstablishmentId, state.establishments]
  );

  const catalog = useMemo(
    () => state.offers.filter((o) => o.establishmentId === selectedEstablishmentId),
    [selectedEstablishmentId, state.offers]
  );

  const [configuringOffer, setConfiguringOffer] = useState<ProductOffer | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<DishOption[]>([]);
  const [qty, setQty] = useState(1);
  const [itemNote, setItemNote] = useState('');
  const [showMap, setShowMap] = useState(false);

  if (!establishment) return null;

  const isFoodSpot =
    establishment.category === 'restaurant' || establishment.category === 'patisserie';

  const openOfferConfig = (offer: ProductOffer) => {
    if (!offer.options || offer.options.length === 0) {
      addToCart(offer, 1);
      return;
    }
    setConfiguringOffer(offer);
    setSelectedOptions([]);
    setQty(1);
    setItemNote('');
  };

  const toggleOption = (opt: DishOption) => {
    setSelectedOptions((prev) =>
      prev.some((o) => o.id === opt.id)
        ? prev.filter((o) => o.id !== opt.id)
        : [...prev, opt]
    );
  };

  const confirmConfiguredOffer = () => {
    if (!configuringOffer) return;
    addToCart(configuringOffer, qty, selectedOptions, itemNote.trim() || undefined);
    setConfiguringOffer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => openEstablishment(null)}
          className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-800 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la découverte</span>
        </button>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Voir le panier</span>
        </button>
      </div>

      {/* En-tête de la fiche établissement */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 min-h-[220px] bg-slate-100">
          <ResilientImage
            src={establishment.imageUrl}
            alt={establishment.name}
            className="w-full h-full object-cover"
            fallbackLabel={establishment.name}
          />
        </div>
        <div className="lg:col-span-7 p-6 space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-teal-800">
              {CATEGORY_LABELS[establishment.category]} · {establishment.neighborhood}, Parakou
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {establishment.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {establishment.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-700 border-t border-slate-100">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
              <span>{establishment.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                {establishment.hours}
                {establishment.prepTimeMin
                  ? ` · Prép. estimée ${establishment.prepTimeMin} min`
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-mono-tabular">{establishment.phone}</span>
            </div>
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
              <span>Modes :</span>
              {establishment.supportsDelivery && <span className="font-medium text-slate-900">Livraison</span>}
              {establishment.supportsPickup && <span className="font-medium text-slate-900">· Retrait</span>}
              {establishment.supportsDineIn && <span className="font-medium text-slate-900">· Sur place</span>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="text-sm font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              {showMap ? 'Masquer la localisation sur carte' : 'Localiser cet établissement sur la carte'}
            </button>
          </div>
        </div>
      </section>

      {showMap && (
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <ParakouInteractiveMap
            compact
            destinationLabel={establishment.name}
            location={{
              coordinates: establishment.coordinates,
              neighborhood: establishment.neighborhood,
              textAddress: establishment.address,
              accessInstructions: `Horaires : ${establishment.hours}`,
              threeWordCode: generateDemoThreeWordCode(
                establishment.coordinates.x,
                establishment.coordinates.y
              ),
            }}
          />
        </section>
      )}

      {/* Catalogue ou Menu */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {isFoodSpot ? 'Menu & préparations' : 'Catalogue disponible'}
          </h2>
          <span className="text-xs text-slate-500">
            {catalog.length} référence(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 justify-between"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <ResilientImage
                  src={offer.imageUrl}
                  alt={offer.productName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{offer.packagingLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className={offer.inStock ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                      {offer.inStock ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 truncate">
                    {offer.productName}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {offer.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3">
                  <span className="text-base font-bold text-slate-900 font-mono-tabular">
                    {formatFcfa(offer.priceFcfa)}
                  </span>
                  <button
                    type="button"
                    disabled={!offer.inStock}
                    onClick={() => openOfferConfig(offer)}
                    className="h-10 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs sm:text-sm font-medium cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {offer.options && offer.options.length > 0 ? 'Choisir options' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modale d'options pour plat de restaurant / pâtisserie */}
      {configuringOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <p className="text-xs font-medium text-teal-800">
                {establishment.name} · Préparation ~{establishment.prepTimeMin ?? 20} min
              </p>
              <h3 className="text-lg font-bold text-slate-900">
                {configuringOffer.productName}
              </h3>
              <p className="text-sm text-slate-600">{configuringOffer.description}</p>
            </div>

            {configuringOffer.options && configuringOffer.options.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Options et accompagnements
                </p>
                <div className="space-y-2">
                  {configuringOffer.options.map((opt) => {
                    const checked = selectedOptions.some((o) => o.id === opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'border-teal-700 bg-teal-50/50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOption(opt)}
                            className="rounded text-teal-700 focus:ring-teal-700"
                          />
                          <span className="text-sm text-slate-800">{opt.label}</span>
                        </div>
                        <span className="text-xs font-mono-tabular text-slate-600">
                          {opt.extraFcfa > 0 ? `+${formatFcfa(opt.extraFcfa)}` : 'Inclus'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Précision pour la cuisine (facultatif)
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Ex. : peu pimenté, sans oignon cru…"
                className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="inline-flex items-center border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfiguringOffer(null)}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmConfiguredOffer}
                  className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium tabular-nums cursor-pointer"
                >
                  Ajouter ·{' '}
                  {formatFcfa(
                    (configuringOffer.priceFcfa +
                      selectedOptions.reduce((s, o) => s + o.extraFcfa, 0)) *
                      qty
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
