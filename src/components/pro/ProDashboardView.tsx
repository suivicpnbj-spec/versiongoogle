import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  MapPin,
  Plus,
  Store,
  ToggleLeft,
  ToggleRight,
  Wrench,
} from 'lucide-react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { CATEGORY_LABELS, IMG_SHAWARMA, IMG_STAPLES } from '../../data/parakouSeed';
import { OrderPrepStatus, ProductOffer } from '../../types/domain';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';
import {
  InterventionStatusLabel,
  PaymentStatusLabel,
  PrepStatusLabel,
} from '../ui/StatusText';

export const ProDashboardView: React.FC = () => {
  const {
    state,
    setActiveProEstablishmentId,
    updateEstablishmentProfile,
    addOffer,
    updateOffer,
    updateOrderPrepStatus,
    toggleProAvailability,
    updateProProfile,
    updateInterventionStatus,
    setInterventionProProgress,
  } = useApp();

  const activeEst = useMemo(
    () =>
      state.establishments.find((e) => e.id === state.activeProEstablishmentId) ??
      state.establishments[0],
    [state.activeProEstablishmentId, state.establishments]
  );

  const isServicePro = activeEst.category === 'service';
  const isFoodSpot =
    activeEst.category === 'restaurant' || activeEst.category === 'patisserie';

  const linkedPro = useMemo(
    () => state.pros.find((p) => p.establishmentId === activeEst.id) ?? null,
    [activeEst.id, state.pros]
  );

  const merchantOffers = useMemo(
    () => state.offers.filter((o) => o.establishmentId === activeEst.id),
    [activeEst.id, state.offers]
  );

  const merchantOrders = useMemo(
    () => state.orders.filter((o) => o.establishmentId === activeEst.id),
    [activeEst.id, state.orders]
  );

  const proInterventions = useMemo(
    () =>
      linkedPro
        ? state.interventions.filter((i) => i.proId === linkedPro.id)
        : [],
    [linkedPro, state.interventions]
  );

  // Formulaire d'ajout de produit ou plat
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPackaging, setNewPackaging] = useState(
    isFoodSpot ? 'Portion individuelle' : 'Sac 5 kg'
  );
  const [newPrice, setNewPrice] = useState('1500');
  const [newStock, setNewStock] = useState('20');
  const [newDesc, setNewDesc] = useState('');
  const [formErr, setFormErr] = useState('');

  // Édition rapide de prix inline
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');

  // Édition rapide profil commerce / resto
  const [prepMinDraft, setPrepMinDraft] = useState(
    String(activeEst.prepTimeMin ?? 20)
  );
  const [hoursDraft, setHoursDraft] = useState(activeEst.hours);
  const [rateDraft, setRateDraft] = useState(
    String(linkedPro?.indicativeRateFcfa ?? 2500)
  );

  const handleSelectProfile = (id: string) => {
    setActiveProEstablishmentId(id);
    const est = state.establishments.find((e) => e.id === id);
    const pro = state.pros.find((p) => p.establishmentId === id);
    if (est) {
      setPrepMinDraft(String(est.prepTimeMin ?? 20));
      setHoursDraft(est.hours);
      setNewPackaging(
        est.category === 'restaurant' || est.category === 'patisserie'
          ? 'Portion individuelle'
          : 'Sachet 1 kg'
      );
    }
    if (pro) {
      setRateDraft(String(pro.indicativeRateFcfa));
    }
    setShowAddForm(false);
    setEditingPriceId(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(newPrice);
    const numericStock = Number(newStock);
    if (!newName.trim() || !newPackaging.trim()) {
      setFormErr('Nom du produit et conditionnement obligatoires.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormErr('Veuillez indiquer un prix valide en FCFA.');
      return;
    }

    const slug = newName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 24);
    const packSlug = newPackaging
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 14);

    const category: ProductOffer['category'] = isFoodSpot
      ? activeEst.category === 'patisserie'
        ? 'patisserie'
        : 'plats'
      : 'epicerie';

    addOffer({
      establishmentId: activeEst.id,
      productName: newName.trim(),
      brandOrOrigin: activeEst.name,
      category,
      packagingLabel: newPackaging.trim(),
      unitGroupKey: `${slug}-${packSlug}`,
      priceFcfa: Math.round(numericPrice),
      inStock: true,
      stockQty: Number.isFinite(numericStock) && numericStock > 0 ? Math.round(numericStock) : 15,
      description:
        newDesc.trim() || `${newName.trim()} disponible chez ${activeEst.name}.`,
      imageUrl: isFoodSpot ? IMG_SHAWARMA : IMG_STAPLES,
    });

    setNewName('');
    setNewPrice('1500');
    setNewDesc('');
    setFormErr('');
    setShowAddForm(false);
  };

  const totalRevenueDemo = useMemo(() => {
    return merchantOrders
      .filter((o) => o.prepStatus !== 'annulee')
      .reduce((sum, o) => sum + o.totalFcfa, 0);
  }, [merchantOrders]);

  return (
    <div className="space-y-6">
      {/* Sélecteur de compte professionnel de démonstration */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-teal-800">
              Espace Professionnel adaptatif · {CATEGORY_LABELS[activeEst.category]}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeEst.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {activeEst.neighborhood} · Toute modification de prix, stock ou statut est immédiatement visible côté client.
            </p>
          </div>

          <div className="shrink-0">
            <label
              htmlFor="pro-account-switcher"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Changer d’établissement / prestataire :
            </label>
            <select
              id="pro-account-switcher"
              value={activeEst.id}
              onChange={(e) => handleSelectProfile(e.target.value)}
              className="h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-700 max-w-full"
            >
              {state.establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name} ({CATEGORY_LABELS[est.category]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Indicateurs d'activité */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {isServicePro && linkedPro ? (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Statut de disponibilité</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-bold text-slate-900">
                    {linkedPro.availableNow ? 'Disponible maintenant' : 'Sur rendez-vous'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleProAvailability(linkedPro.id)}
                    className="text-teal-700 hover:text-teal-900 cursor-pointer"
                    aria-label="Basculer la disponibilité"
                  >
                    {linkedPro.availableNow ? (
                      <ToggleRight className="w-7 h-7" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Demandes d’intervention</p>
                <p className="text-xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {proInterventions.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Tarif indicatif de base</p>
                <p className="text-xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {formatFcfa(linkedPro.indicativeRateFcfa)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Commandes reçues</p>
                <p className="text-xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {merchantOrders.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">
                  {isFoodSpot ? 'Plats au menu' : 'Produits au catalogue'}
                </p>
                <p className="text-xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {merchantOffers.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs text-slate-500">Volume d’activité (démo)</p>
                <p className="text-xl font-bold text-slate-900 font-mono-tabular mt-1">
                  {formatFcfa(totalRevenueDemo)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* INTERFACE ADAPTÉE AU PRESTATAIRE / ARTISAN */}
      {isServicePro && linkedPro ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-700" />
              <span>Profil & tarif d’intervention</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tarif indicatif de base (FCFA)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={rateDraft}
                    onChange={(e) => setRateDraft(e.target.value)}
                    className="flex-1 h-11 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = Number(rateDraft);
                      if (val > 0) updateProProfile(linkedPro.id, { indicativeRateFcfa: val });
                    }}
                    className="h-11 px-4 rounded-xl bg-teal-700 text-white text-sm font-medium cursor-pointer"
                  >
                    Mettre à jour
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700 mb-1.5">
                  Prestations proposées
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {linkedPro.servicesList.map((s) => (
                    <li key={s} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Demandes d’intervention reçues ({proInterventions.length})
            </h2>

            {proInterventions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600">
                Aucune demande reçue pour ce prestataire. Créez-en une depuis l’espace Client (« Services ») pour tester la réception en direct.
              </div>
            ) : (
              proInterventions.map((intv) => (
                <article
                  key={intv.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 font-mono-tabular">
                        {intv.id} · {intv.customerName} ({intv.customerPhone})
                      </p>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {intv.location.neighborhood} — {intv.location.textAddress}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Accès : {intv.location.accessInstructions} ·{' '}
                        <span className="font-mono-tabular text-teal-800">
                          {intv.location.threeWordCode}
                        </span>
                      </p>
                    </div>
                    <InterventionStatusLabel status={intv.status} />
                  </div>

                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {intv.problemDescription}
                  </p>

                  <ParakouInteractiveMap
                    compact
                    location={intv.location}
                    originCoordinates={linkedPro.coordinates}
                    originLabel={linkedPro.proName}
                    destinationLabel={intv.customerName}
                    movingProgress={
                      intv.status === 'en_route' || intv.status === 'sur_place'
                        ? intv.proProgress
                        : undefined
                    }
                    movingLabel="Votre trajet"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {intv.status === 'envoyee' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            updateInterventionStatus(
                              intv.id,
                              'acceptee',
                              'Demande acceptée, préparation de la trousse d’intervention.'
                            )
                          }
                          className="h-10 px-4 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-medium cursor-pointer"
                        >
                          Accepter la demande
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateInterventionStatus(
                              intv.id,
                              'refusee',
                              'Indisponible sur ce créneau.'
                            )
                          }
                          className="h-10 px-4 rounded-xl border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium cursor-pointer"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {intv.status === 'acceptee' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateInterventionStatus(
                            intv.id,
                            'en_route',
                            'En route vers votre position.'
                          )
                        }
                        className="h-10 px-4 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-medium cursor-pointer"
                      >
                        Démarrer le trajet vers le client
                      </button>
                    )}
                    {intv.status === 'en_route' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setInterventionProProgress(intv.id, 100)}
                          className="h-10 px-4 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-medium cursor-pointer"
                        >
                          Marquer « Arrivé sur place »
                        </button>
                      </>
                    )}
                    {intv.status === 'sur_place' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateInterventionStatus(
                            intv.id,
                            'terminee',
                            'Intervention réalisée et vérifiée avec le client.'
                          )
                        }
                        className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium cursor-pointer"
                      >
                        Clôturer l’intervention
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      ) : (
        /* INTERFACE ADAPTÉE AU COMMERCE / SUPERMARCHÉ / RESTAURANT */
        <div className="space-y-6">
          {/* Paramètres rapides de l'établissement */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Horaires d’ouverture
                </label>
                <input
                  type="text"
                  value={hoursDraft}
                  onChange={(e) => setHoursDraft(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                />
              </div>
              {isFoodSpot && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Délai estimé de préparation (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={prepMinDraft}
                    onChange={(e) => setPrepMinDraft(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                updateEstablishmentProfile(activeEst.id, {
                  hours: hoursDraft,
                  prepTimeMin: isFoodSpot ? Number(prepMinDraft) || 20 : activeEst.prepTimeMin,
                })
              }
              className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-800 cursor-pointer shrink-0"
            >
              Enregistrer les infos
            </button>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* File des commandes reçues */}
            <section className="lg:col-span-5 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                {isFoodSpot ? 'Cuisine & commandes reçues' : 'Commandes clients'} (
                {merchantOrders.length})
              </h2>

              {merchantOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
                  Aucune commande en cours pour {activeEst.name}. Passez une commande depuis l’espace Client pour la traiter ici.
                </div>
              ) : (
                <div className="space-y-3">
                  {merchantOrders.map((ord) => {
                    const nextActions: Array<{
                      status: OrderPrepStatus;
                      label: string;
                      tone: string;
                    }> = [];
                    if (ord.prepStatus === 'nouvelle') {
                      nextActions.push({
                        status: 'confirmee',
                        label: 'Accepter',
                        tone: 'bg-teal-700 text-white hover:bg-teal-800',
                      });
                      nextActions.push({
                        status: 'annulee',
                        label: 'Refuser',
                        tone: 'border border-rose-200 text-rose-700 hover:bg-rose-50',
                      });
                    } else if (ord.prepStatus === 'confirmee') {
                      nextActions.push({
                        status: 'en_preparation',
                        label: isFoodSpot ? 'Lancer en cuisine' : 'Préparer le colis',
                        tone: 'bg-teal-700 text-white hover:bg-teal-800',
                      });
                    } else if (ord.prepStatus === 'en_preparation') {
                      nextActions.push({
                        status: 'prete',
                        label:
                          ord.fulfillmentMode === 'livraison'
                            ? 'Prête pour le livreur'
                            : 'Prête pour le client',
                        tone: 'bg-emerald-700 text-white hover:bg-emerald-800',
                      });
                    }

                    return (
                      <article
                        key={ord.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-mono-tabular font-semibold text-slate-900">
                              {ord.id} · {ord.customerName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {ord.fulfillmentMode === 'livraison'
                                ? `Livraison (${ord.location?.neighborhood ?? 'Parakou'})`
                                : ord.fulfillmentMode === 'retrait'
                                ? 'Retrait sur place'
                                : 'Sur place'}
                            </p>
                          </div>
                          <span className="font-mono-tabular text-sm font-bold text-slate-900">
                            {formatFcfa(ord.totalFcfa)}
                          </span>
                        </div>

                        <ul className="text-xs text-slate-700 space-y-1 border-t border-slate-100 pt-2">
                          {ord.items.map((item) => (
                            <li key={item.id}>
                              {item.quantity} × {item.productName} ({item.packagingLabel})
                            </li>
                          ))}
                        </ul>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <PrepStatusLabel status={ord.prepStatus} />
                          <PaymentStatusLabel status={ord.paymentStatus} />
                        </div>

                        {nextActions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {nextActions.map((act) => (
                              <button
                                key={act.status}
                                type="button"
                                onClick={() => updateOrderPrepStatus(ord.id, act.status)}
                                className={`h-9 px-3.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${act.tone}`}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Gestion catalogue / menu & tarifs */}
            <section className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {isFoodSpot ? 'Carte & plats' : 'Catalogue produits & tarifs'} (
                  {merchantOffers.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isFoodSpot ? 'Ajouter un plat' : 'Ajouter un produit'}</span>
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleCreateProduct}
                  className="bg-white border border-teal-200 rounded-2xl p-4 space-y-3"
                >
                  <h3 className="text-sm font-bold text-slate-900">
                    Nouvel article pour {activeEst.name}
                  </h3>
                  {formErr && (
                    <p className="text-xs font-medium text-rose-700">{formErr}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Désignation
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={
                          isFoodSpot
                            ? 'Ex. : Brochettes de bœuf épicées'
                            : 'Ex. : Sucre en poudre blanc'
                        }
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Conditionnement exact
                      </label>
                      <input
                        type="text"
                        value={newPackaging}
                        onChange={(e) => setNewPackaging(e.target.value)}
                        placeholder="Ex. : Sachet 1 kg, Sac 5 kg, Portion"
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Prix (FCFA)
                      </label>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full h-10 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Stock initial
                      </label>
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="w-full h-10 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Description courte
                    </label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Précisions utiles pour le client…"
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="h-10 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      Publier dans le catalogue
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {merchantOffers.map((offer) => {
                  const isEditing = editingPriceId === offer.id;
                  return (
                    <div
                      key={offer.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {offer.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {offer.packagingLabel} · MàJ {offer.updatedAt} ·{' '}
                          <span
                            className={
                              offer.inStock
                                ? 'text-emerald-700 font-medium'
                                : 'text-rose-700 font-medium'
                            }
                          >
                            {offer.inStock ? `En stock (${offer.stockQty})` : 'Rupture'}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={priceDraft}
                              onChange={(e) => setPriceDraft(e.target.value)}
                              className="w-24 h-9 px-2.5 text-sm font-mono-tabular border border-teal-600 rounded-lg focus:outline-none"
                              aria-label="Nouveau prix en FCFA"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextP = Number(priceDraft);
                                if (nextP > 0) {
                                  updateOffer(offer.id, { priceFcfa: Math.round(nextP) });
                                }
                                setEditingPriceId(null);
                              }}
                              className="h-9 px-3 rounded-lg bg-teal-700 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>OK</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(offer.id);
                              setPriceDraft(String(offer.priceFcfa));
                            }}
                            className="h-9 px-3 rounded-lg border border-slate-200 hover:border-teal-600 text-sm font-bold font-mono-tabular text-slate-900 cursor-pointer"
                            title="Cliquer pour modifier le prix"
                          >
                            {formatFcfa(offer.priceFcfa)}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            updateOffer(offer.id, {
                              inStock: !offer.inStock,
                              stockQty: !offer.inStock ? Math.max(10, offer.stockQty) : 0,
                            })
                          }
                          className={`h-9 px-3 rounded-lg text-xs font-medium border cursor-pointer ${
                            offer.inStock
                              ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {offer.inStock ? 'Marquer rupture' : 'Remettre en stock'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
