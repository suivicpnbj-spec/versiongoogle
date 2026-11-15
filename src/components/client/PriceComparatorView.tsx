import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Search,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { PARAKOU_NEIGHBORHOODS, estimateDistanceKm } from '../../data/parakouSeed';
import { ProductOffer } from '../../types/domain';
import { ResilientImage } from '../ui/ResilientImage';

const QUICK_KEYWORDS = ['Riz', 'Sel', 'Piment', 'Huile', 'Biscuit', 'Shawarma'];

interface ComparisonGroup {
  unitGroupKey: string;
  productName: string;
  packagingLabel: string;
  category: ProductOffer['category'];
  offers: Array<{
    offer: ProductOffer;
    establishmentName: string;
    neighborhood: string;
    distanceKm: number;
  }>;
  lowestAvailablePrice: number | null;
}

export const PriceComparatorView: React.FC = () => {
  const {
    state,
    globalSearchQuery,
    setGlobalSearchQuery,
    addToCart,
    openEstablishment,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductOffer['category']>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const userCoords = useMemo(() => {
    return (
      state.customerProfile.savedAddresses[0]?.location.coordinates ??
      PARAKOU_NEIGHBORHOODS[1].coordinates
    );
  }, [state.customerProfile.savedAddresses]);

  // Groupement STRICT par unitGroupKey (produit + conditionnement exact)
  // Ne jamais comparer des conditionnements différents dans un même tableau!
  const groupedComparisons = useMemo<ComparisonGroup[]>(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    const groups = new Map<string, ComparisonGroup>();

    for (const offer of state.offers) {
      if (categoryFilter !== 'all' && offer.category !== categoryFilter) continue;
      if (onlyAvailable && !offer.inStock) continue;

      const est = state.establishments.find((e) => e.id === offer.establishmentId);
      if (!est) continue;

      const haystack = `${offer.productName} ${offer.brandOrOrigin} ${offer.packagingLabel} ${est.name} ${est.neighborhood}`.toLowerCase();
      if (q && !haystack.includes(q)) continue;

      const existing = groups.get(offer.unitGroupKey);
      const entry = {
        offer,
        establishmentName: est.name,
        neighborhood: est.neighborhood,
        distanceKm: estimateDistanceKm(userCoords, est.coordinates),
      };

      if (existing) {
        existing.offers.push(entry);
      } else {
        groups.set(offer.unitGroupKey, {
          unitGroupKey: offer.unitGroupKey,
          productName: offer.productName,
          packagingLabel: offer.packagingLabel,
          category: offer.category,
          offers: [entry],
          lowestAvailablePrice: null,
        });
      }
    }

    const result: ComparisonGroup[] = [];
    for (const grp of groups.values()) {
      grp.offers.sort((a, b) => {
        if (a.offer.inStock !== b.offer.inStock) return a.offer.inStock ? -1 : 1;
        return a.offer.priceFcfa - b.offer.priceFcfa;
      });
      const availablePrices = grp.offers
        .filter((x) => x.offer.inStock)
        .map((x) => x.offer.priceFcfa);
      grp.lowestAvailablePrice =
        availablePrices.length > 0 ? Math.min(...availablePrices) : null;
      result.push(grp);
    }

    // Mettre en avant les conditionnements ayant plusieurs vendeurs comparables
    result.sort((a, b) => b.offers.length - a.offers.length);
    return result;
  }, [
    categoryFilter,
    globalSearchQuery,
    onlyAvailable,
    state.establishments,
    state.offers,
    userCoords,
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Rechercher et comparer les prix
          </h1>
          <p className="text-sm text-slate-600">
            Chaque comparaison distingue strictement le conditionnement exact (ex. : sac 5 kg séparé de la mesure 1 kg) avec date d’actualisation et disponibilité.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Tapez un produit : riz, sel, piment, huile, biscuit…"
              className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/25 focus:border-teal-700"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'all' | ProductOffer['category'])
              }
              aria-label="Filtrer par rayon"
              className="h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-700"
            >
              <option value="all">Tous les rayons</option>
              <option value="epicerie">Épicerie & vivres</option>
              <option value="plats">Plats cuisinés</option>
              <option value="patisserie">Pâtisserie</option>
              <option value="boissons">Boissons</option>
              <option value="equipement">Équipement</option>
              <option value="hebergement">Hébergement</option>
            </select>

            <label className="h-11 px-3.5 inline-flex items-center gap-2 text-sm bg-white border border-slate-200 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-teal-700 focus:ring-teal-700"
              />
              <span className="text-slate-700">En stock uniquement</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-500 shrink-0">Recherches fréquentes :</span>
          {QUICK_KEYWORDS.map((kw) => {
            const active = globalSearchQuery.trim().toLowerCase() === kw.toLowerCase();
            return (
              <button
                key={kw}
                type="button"
                onClick={() => setGlobalSearchQuery(active ? '' : kw)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {kw}
              </button>
            );
          })}
          {globalSearchQuery && (
            <button
              type="button"
              onClick={() => setGlobalSearchQuery('')}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 px-2 cursor-pointer whitespace-nowrap"
            >
              Tout afficher
            </button>
          )}
        </div>
      </div>

      {/* Résultats groupés par conditionnement exact */}
      {groupedComparisons.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900">
            Aucun produit trouvé pour « {globalSearchQuery} ».
          </p>
          <p className="text-sm text-slate-600">
            Essayez avec un mot-clé courant comme « riz », « sel », « huile » ou « piment ».
          </p>
          <button
            type="button"
            onClick={() => {
              setGlobalSearchQuery('');
              setCategoryFilter('all');
              setOnlyAvailable(false);
            }}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedComparisons.map((group) => {
            const firstImg = group.offers[0]?.offer.imageUrl;
            const hasMultiple = group.offers.length > 1;
            const prices = group.offers
              .filter((x) => x.offer.inStock)
              .map((x) => x.offer.priceFcfa);
            const maxPrice = prices.length > 1 ? Math.max(...prices) : null;
            const savings =
              group.lowestAvailablePrice !== null && maxPrice !== null
                ? maxPrice - group.lowestAvailablePrice
                : 0;

            return (
              <section
                key={group.unitGroupKey}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                {/* En-tête du groupe produit + conditionnement exact */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <ResilientImage
                        src={firstImg}
                        alt={group.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-teal-800">
                          Conditionnement : {group.packagingLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{group.offers.length} point(s) de vente</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5">
                        {group.productName}
                      </h2>
                    </div>
                  </div>

                  {hasMultiple && savings > 0 && (
                    <div className="text-xs sm:text-sm text-emerald-800 font-medium tabular-nums">
                      Écart constaté : jusqu’à {formatFcfa(savings)} d’économie sur ce format
                    </div>
                  )}
                </div>

                {/* Liste comparative des vendeurs pour CE conditionnement uniquement */}
                <div className="divide-y divide-slate-100">
                  {group.offers.map(({ offer, establishmentName, neighborhood, distanceKm }) => {
                    const isCheapest =
                      hasMultiple &&
                      offer.inStock &&
                      group.lowestAvailablePrice !== null &&
                      offer.priceFcfa === group.lowestAvailablePrice;

                    return (
                      <div
                        key={offer.id}
                        className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEstablishment(offer.establishmentId)}
                              className="text-sm sm:text-base font-semibold text-slate-900 hover:text-teal-800 inline-flex items-center gap-1.5 cursor-pointer text-left"
                            >
                              <span>{establishmentName}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            {isCheapest && (
                              <span className="text-xs font-semibold text-emerald-700">
                                · Meilleur prix sur {offer.packagingLabel}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{neighborhood}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{distanceKm} km</span>
                            <span aria-hidden="true">·</span>
                            <span>Prix actualisé le {offer.updatedAt}</span>
                            <span aria-hidden="true">·</span>
                            {offer.inStock ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>En stock ({offer.stockQty})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rupture temporaire</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                          <div className="text-left md:text-right">
                            <p className="text-base sm:text-lg font-bold text-slate-900 font-mono-tabular">
                              {formatFcfa(offer.priceFcfa)}
                            </p>
                            <p className="text-xs text-slate-500">{offer.packagingLabel}</p>
                          </div>

                          <button
                            type="button"
                            disabled={!offer.inStock}
                            onClick={() => addToCart(offer, 1)}
                            className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Ajouter</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
