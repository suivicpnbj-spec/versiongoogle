import React, { useMemo, useState } from 'react';
import { ArrowRight, Clock, MapPin, Search, SlidersHorizontal, Wrench } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import {
  CATEGORY_LABELS,
  IMG_HERO_MARKET,
  PARAKOU_NEIGHBORHOODS,
  estimateDistanceKm,
} from '../../data/parakouSeed';
import { EstablishmentCategory } from '../../types/domain';
import { ResilientImage } from '../ui/ResilientImage';

const CATEGORY_TABS: Array<{ key: 'all' | EstablishmentCategory; label: string }> = [
  { key: 'all', label: 'Tout découvrir' },
  { key: 'supermarche', label: 'Supermarchés' },
  { key: 'alimentation', label: 'Alimentation' },
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'patisserie', label: 'Pâtisseries' },
  { key: 'hotel', label: 'Hôtels' },
  { key: 'boutique', label: 'Boutiques' },
  { key: 'service', label: 'Services & Pros' },
];

export const DiscoverView: React.FC = () => {
  const {
    state,
    openEstablishment,
    openCompareWithQuery,
    setClientTab,
  } = useApp();

  const [searchInput, setSearchInput] = useState('');
  const [selectedCat, setSelectedCat] = useState<'all' | EstablishmentCategory>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');

  const userDefaultCoords = useMemo(() => {
    const saved = state.customerProfile.savedAddresses[0];
    return (
      saved?.location.coordinates ??
      PARAKOU_NEIGHBORHOODS[1].coordinates
    );
  }, [state.customerProfile.savedAddresses]);

  const filteredEstablishments = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return state.establishments.filter((est) => {
      if (selectedCat !== 'all' && est.category !== selectedCat) return false;
      if (selectedNeighborhood !== 'all' && est.neighborhood !== selectedNeighborhood)
        return false;
      if (!q) return true;
      const matchesEst =
        est.name.toLowerCase().includes(q) ||
        est.neighborhood.toLowerCase().includes(q) ||
        est.description.toLowerCase().includes(q) ||
        CATEGORY_LABELS[est.category].toLowerCase().includes(q);
      const matchesProduct = state.offers.some(
        (o) =>
          o.establishmentId === est.id &&
          o.productName.toLowerCase().includes(q)
      );
      return matchesEst || matchesProduct;
    });
  }, [searchInput, selectedCat, selectedNeighborhood, state.establishments, state.offers]);

  const matchingProductsCount = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return 0;
    return state.offers.filter((o) => o.productName.toLowerCase().includes(q)).length;
  }, [searchInput, state.offers]);

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    if (matchingProductsCount > 0 && filteredEstablishments.length === 0) {
      openCompareWithQuery(q);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Hero éditoriale & recherche unifiée */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium text-teal-800 tracking-wide">
              {BRAND_CONFIG.cityDefault}, {BRAND_CONFIG.countryDefault} · Quartier actif : {state.customerProfile.defaultNeighborhood}
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance leading-[1.15]">
              Commerces, prix locaux, repas et artisans à votre portée.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Comparez les prix exacts par conditionnement, commandez auprès des enseignes de Parakou ou sollicitez un professionnel géolocalisé jusqu’à votre portail.
            </p>
          </div>

          <form onSubmit={handleGlobalSearchSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher un produit (riz, sel, shawarma) ou un lieu (Albarika)…"
                  className="w-full h-12 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/25 focus:border-teal-700"
                />
              </div>
              <button
                type="button"
                onClick={() => openCompareWithQuery(searchInput.trim() || 'riz')}
                className="h-12 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Comparer les prix</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {searchInput.trim() && matchingProductsCount > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>
                  {matchingProductsCount} offre(s) de produits trouvée(s) pour « {searchInput.trim()} »
                </span>
                <button
                  type="button"
                  onClick={() => openCompareWithQuery(searchInput.trim())}
                  className="font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  Ouvrir dans le comparateur
                </button>
              </div>
            )}

            {/* Raccourcis d'accès rapides aux usages principaux */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => openCompareWithQuery('riz')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Comparer le riz à Parakou
              </button>
              <button
                type="button"
                onClick={() => openEstablishment('est-grillades-nord')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Commander un shawarma
              </button>
              <button
                type="button"
                onClick={() => setClientTab('services')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Wrench className="w-3.5 h-3.5 text-teal-700" />
                <span>Dépannage moto ou plombier</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 relative min-h-[210px] lg:min-h-full bg-slate-100">
          <ResilientImage
            src={IMG_HERO_MARKET}
            alt="Commerce de proximité et marché alimentaire à Parakou"
            className="w-full h-full object-cover"
            fallbackLabel="Marché de proximité à Parakou"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white">
            <p className="text-xs font-medium text-white/90">
              Livraison guidée jusqu’au portail · Paiement démo transparent
            </p>
          </div>
        </div>
      </section>

      {/* Filtres catégories & quartiers */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TABS.map((cat) => {
              const active = selectedCat === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCat(cat.key)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <label htmlFor="neighborhood-filter" className="sr-only">
              Filtrer par quartier
            </label>
            <select
              id="neighborhood-filter"
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-700"
            >
              <option value="all">Tous les quartiers</option>
              {PARAKOU_NEIGHBORHOODS.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille des établissements */}
        {filteredEstablishments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <p className="text-base font-semibold text-slate-900">
              Aucun établissement ne correspond à cette recherche.
            </p>
            <p className="text-sm text-slate-600">
              Essayez un autre quartier ou lancez une recherche produit dans le comparateur de prix.
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSelectedCat('all');
                  setSelectedNeighborhood('all');
                }}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
              {searchInput.trim() && (
                <button
                  type="button"
                  onClick={() => openCompareWithQuery(searchInput.trim())}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-teal-700 text-white hover:bg-teal-800 cursor-pointer"
                >
                  Chercher dans les produits
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEstablishments.map((est) => {
              const dist = estimateDistanceKm(userDefaultCoords, est.coordinates);
              const offersCount = state.offers.filter(
                (o) => o.establishmentId === est.id && o.inStock
              ).length;

              return (
                <article
                  key={est.id}
                  onClick={() => {
                    if (est.category === 'service') {
                      setClientTab('services');
                    } else {
                      openEstablishment(est.id);
                    }
                  }}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-teal-600/50 transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    <ResilientImage
                      src={est.imageUrl}
                      alt={est.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      fallbackLabel={est.name}
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-teal-800">
                          {CATEGORY_LABELS[est.category]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{est.neighborhood}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{dist} km</span>
                      </div>
                      <h2 className="text-base font-semibold text-slate-900 group-hover:text-teal-800 transition-colors">
                        {est.name}
                      </h2>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-snug">
                        {est.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        {est.prepTimeMin ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Prép. ~{est.prepTimeMin} min</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{est.hours}</span>
                          </>
                        )}
                      </span>
                      <span className="font-medium text-slate-900 inline-flex items-center gap-1">
                        {est.category === 'service'
                          ? 'Solliciter'
                          : offersCount > 0
                          ? `${offersCount} article(s)`
                          : 'Consulter'}
                        <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
                      </span>
                    </div>
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
