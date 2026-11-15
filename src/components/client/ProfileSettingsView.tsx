import React, { useState } from 'react';
import { CheckCircle2, MapPin, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';
import { useApp } from '../../context/AppContext';
import { PARAKOU_NEIGHBORHOODS } from '../../data/parakouSeed';
import { DeliveryLocation } from '../../types/domain';
import { ParakouInteractiveMap } from '../map/ParakouInteractiveMap';

export const ProfileSettingsView: React.FC = () => {
  const {
    state,
    updateCustomerProfile,
    addSavedAddress,
    removeSavedAddress,
    resetDemoData,
    notify,
  } = useApp();

  const [name, setName] = useState(state.customerProfile.name);
  const [phone, setPhone] = useState(state.customerProfile.phone);
  const [defaultNeighborhood, setDefaultNeighborhood] = useState(
    state.customerProfile.defaultNeighborhood
  );
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('');
  const [newLoc, setNewLoc] = useState<DeliveryLocation>({
    coordinates: PARAKOU_NEIGHBORHOODS[0].coordinates,
    neighborhood: 'Banikanni',
    textAddress: 'Banikanni, rue pavée',
    accessInstructions: 'Portail blanc à gauche après la station.',
    threeWordCode: '///mangue.palmier.cour',
    gpsSource: 'preset',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile({ name, phone, defaultNeighborhood });
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrTitle.trim()) return;
    addSavedAddress(newAddrTitle.trim(), newLoc);
    setNewAddrTitle('');
    setAddingAddr(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Profil, adresses et paramètres
        </h1>
        <p className="text-sm text-slate-600">
          Gérez vos coordonnées, vos points de repère à Parakou et les options de démonstration locale.
        </p>
      </div>

      {/* Coordonnées client */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900">Informations client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3 text-sm font-mono-tabular border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Quartier habituel
            </label>
            <select
              value={defaultNeighborhood}
              onChange={(e) => setDefaultNeighborhood(e.target.value)}
              className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-teal-700"
            >
              {PARAKOU_NEIGHBORHOODS.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium cursor-pointer"
        >
          Enregistrer le profil
        </button>
      </form>

      {/* Adresses enregistrées */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Points de livraison enregistrés ({state.customerProfile.savedAddresses.length})
          </h2>
          <button
            type="button"
            onClick={() => setAddingAddr((v) => !v)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un repère</span>
          </button>
        </div>

        {addingAddr && (
          <form
            onSubmit={handleAddAddress}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nom du repère (ex. : Maison familiale, Atelier)
              </label>
              <input
                type="text"
                required
                value={newAddrTitle}
                onChange={(e) => setNewAddrTitle(e.target.value)}
                placeholder="Ex. : Domicile Banikanni"
                className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-700"
              />
            </div>
            <ParakouInteractiveMap
              compact
              editable
              location={newLoc}
              onChange={setNewLoc}
              onNotify={notify}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingAddr(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-teal-700 text-white text-sm font-medium cursor-pointer"
              >
                Enregistrer ce lieu
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {state.customerProfile.savedAddresses.map((addr) => (
            <div
              key={addr.id}
              className="py-3 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {addr.title}{' '}
                    <span className="font-mono-tabular text-xs font-normal text-teal-800">
                      {addr.location.threeWordCode}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600">
                    {addr.location.neighborhood} — {addr.location.textAddress}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Accès : {addr.location.accessInstructions}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeSavedAddress(addr.id)}
                className="p-2 text-slate-400 hover:text-rose-700 cursor-pointer"
                aria-label={`Supprimer ${addr.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Préparation technique & Réinitialisation démo */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Architecture & données de démonstration
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {BRAND_CONFIG.demoNotice}
            </p>
          </div>
          <button
            type="button"
            onClick={resetDemoData}
            className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-800 inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser la démo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          {BRAND_CONFIG.futureIntegrations.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 text-xs text-slate-700"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
