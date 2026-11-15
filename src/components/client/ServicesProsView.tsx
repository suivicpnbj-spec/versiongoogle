import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Wrench,
  X,
} from 'lucide-react';
import { formatFcfa } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import {
  PARAKOU_NEIGHBORHOODS,
  SPECIALTY_LABELS,
  estimateDistanceKm,
} from '../../data/parakouSeed';
import { DeliveryLocation, ProServiceProfile, ProSpecialty } from '../../types/domain';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';

const NEED_PRESETS = [
  {
    label: 'Panne de moto / crevaison',
    specialty: 'mecanicien' as const,
    text: 'Panne de moto en bord de voie (pneu arrière crevé ou problème d’allumage).',
  },
  {
    label: 'Fuite d’eau / plomberie',
    specialty: 'plombier' as const,
    text: 'Fuite d’eau importante sous évier / robinet de cour à réparer rapidement.',
  },
  {
    label: 'Climatiseur / frigo en panne',
    specialty: 'reparateur' as const,
    text: 'Climatiseur split qui ne refroidit plus ou réfrigérateur en panne.',
  },
  {
    label: 'Serrure ou portail bloqué',
    specialty: 'menuisier' as const,
    text: 'Serrure bloquée nécessitant un remplacement ou une ouverture propre.',
  },
];

export const ServicesProsView: React.FC = () => {
  const { state, createIntervention, notify } = useApp();

  const [selectedSpecialty, setSelectedSpecialty] = useState<'all' | ProSpecialty>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [needText, setNeedText] = useState('');
  const [selectedPro, setSelectedPro] = useState<ProServiceProfile | null>(null);
  const [formError, setFormError] = useState('');

  const defaultLoc: DeliveryLocation = useMemo(
    () =>
      state.customerProfile.savedAddresses[0]?.location ?? {
        coordinates: PARAKOU_NEIGHBORHOODS[1].coordinates,
        neighborhood: 'Albarika',
        textAddress: 'Albarika, proche carrefour principal',
        accessInstructions: 'Précisez votre point de repère pour le professionnel.',
        threeWordCode: '///carrefour.karite.portail',
        gpsSource: 'preset',
      },
    [state.customerProfile.savedAddresses]
  );

  const [interventionLoc, setInterventionLoc] = useState<DeliveryLocation>(defaultLoc);
  const [customerName, setCustomerName] = useState(state.customerProfile.name);
  const [customerPhone, setCustomerPhone] = useState(state.customerProfile.phone);

  const filteredPros = useMemo(() => {
    return state.pros
      .filter((pro) => {
        if (selectedSpecialty !== 'all' && pro.specialty !== selectedSpecialty) return false;
        if (onlyAvailable && !pro.availableNow) return false;
        return true;
      })
      .sort((a, b) => (a.availableNow === b.availableNow ? 0 : a.availableNow ? -1 : 1));
  }, [onlyAvailable, selectedSpecialty, state.pros]);

  const handleOpenProModal = (pro: ProServiceProfile) => {
    setSelectedPro(pro);
    setFormError('');
    if (!needText.trim()) {
      const matchingPreset = NEED_PRESETS.find((p) => p.specialty === pro.specialty);
      if (matchingPreset) setNeedText(matchingPreset.text);
    }
  };

  const handleSubmitIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPro) return;
    if (!needText.trim() || needText.trim().length < 8) {
      setFormError('Veuillez décrire brièvement votre besoin ou votre panne.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Veuillez renseigner votre nom et numéro de téléphone.');
      return;
    }
    if (!interventionLoc.textAddress.trim()) {
      setFormError('Veuillez préciser l’adresse ou le repère de l’intervention.');
      return;
    }

    createIntervention({
      proId: selectedPro.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      problemDescription: needText.trim(),
      location: interventionLoc,
    });
    setSelectedPro(null);
  };

  return (
    <div className="space-y-6">
      {/* Zone de description du besoin */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Trouver un professionnel à proximité
          </h1>
          <p className="text-sm text-slate-600">
            Décrivez votre besoin, comparez les tarifs indicatifs et envoyez votre position exacte pour une intervention sur place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {NEED_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setNeedText(preset.text);
                setSelectedSpecialty(preset.specialty);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 cursor-pointer transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label htmlFor="pro-need" className="sr-only">
              Description du besoin
            </label>
            <input
              id="pro-need"
              type="text"
              value={needText}
              onChange={(e) => setNeedText(e.target.value)}
              placeholder="Décrivez votre panne ou prestation souhaitée…"
              className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value as 'all' | ProSpecialty)}
              aria-label="Catégorie de professionnel"
              className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-700"
            >
              <option value="all">Toutes spécialités</option>
              {Object.entries(SPECIALTY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <label className="md:col-span-2 h-11 px-3 inline-flex items-center justify-center gap-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-700"
            />
            <span className="whitespace-nowrap">Disponibles</span>
          </label>
        </div>
      </section>

      {/* Liste des professionnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPros.map((pro) => {
          const dist = estimateDistanceKm(interventionLoc.coordinates, pro.coordinates);

          return (
            <article
              key={pro.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-teal-800">
                        {pro.specialtyLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{pro.neighborhood}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{dist} km</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {pro.proName}
                    </h2>
                  </div>

                  <span
                    className={`text-xs font-semibold inline-flex items-center gap-1 shrink-0 ${
                      pro.availableNow ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{pro.availableNow ? 'Disponible' : 'Sur rendez-vous'}</span>
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{pro.bio}</p>

                <ul className="space-y-1 text-xs text-slate-700 border-t border-slate-100 pt-3">
                  {pro.servicesList.map((srv) => (
                    <li key={srv} className="flex items-start gap-2">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>{srv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900 font-mono-tabular">
                    {formatFcfa(pro.indicativeRateFcfa)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {pro.rateUnit} · Arrivée ~{pro.responseTimeMin} min
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenProModal(pro)}
                  className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Demander une intervention</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modale d'envoi de demande d'intervention avec localisation exacte */}
      {selectedPro && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmitIntervention}
            className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-teal-800">
                  {selectedPro.specialtyLabel} · {selectedPro.neighborhood}
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  Solliciter {selectedPro.proName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Arrivée estimée ~{selectedPro.responseTimeMin} min
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono-tabular">
                    <Phone className="w-3.5 h-3.5" /> {selectedPro.phone}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPro(null)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description du problème ou de la prestation
              </label>
              <textarea
                rows={2}
                value={needText}
                onChange={(e) => setNeedText(e.target.value)}
                placeholder="Ex. : Moto immobilisée près du carrefour, pneu crevé…"
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Votre nom
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone de contact
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                <span>Position exacte de l’intervention à Parakou</span>
              </div>
              <ParakouInteractiveMap
                compact
                editable
                location={interventionLoc}
                onChange={setInterventionLoc}
                originCoordinates={selectedPro.coordinates}
                originLabel={selectedPro.proName}
                destinationLabel="Lieu d’intervention"
                savedAddresses={state.customerProfile.savedAddresses}
                onNotify={notify}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPro(null)}
                className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-11 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium cursor-pointer"
              >
                Envoyer la demande d’intervention
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
