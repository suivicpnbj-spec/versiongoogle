import React from 'react';
import {
  Compass,
  History,
  Navigation,
  Scale,
  ShoppingBag,
  Store,
  Truck,
  User,
  Wrench,
} from 'lucide-react';
import { BRAND_CONFIG } from './config/brand';
import { AppProvider, useApp } from './context/AppContext';
import { ActivityHistoryView } from './components/client/ActivityHistoryView';
import { CartCheckoutDrawer } from './components/client/CartCheckoutDrawer';
import { DiscoverView } from './components/client/DiscoverView';
import { EstablishmentDetailView } from './components/client/EstablishmentDetailView';
import { OrderTrackingView } from './components/client/OrderTrackingView';
import { PriceComparatorView } from './components/client/PriceComparatorView';
import { ProfileSettingsView } from './components/client/ProfileSettingsView';
import { ServicesProsView } from './components/client/ServicesProsView';
import { DeliveryDashboardView } from './components/delivery/DeliveryDashboardView';
import { ProDashboardView } from './components/pro/ProDashboardView';
import { ToastContainer } from './components/ui/ToastContainer';
import { ClientTab, WorkspaceMode } from './types/domain';

const AppShell: React.FC = () => {
  const {
    workspace,
    setWorkspace,
    clientTab,
    setClientTab,
    selectedEstablishmentId,
    openEstablishment,
    cart,
    setCartOpen,
    state,
  } = useApp();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeTrackingCount =
    state.orders.filter(
      (o) => o.prepStatus !== 'annulee' && o.deliveryStatus !== 'livree'
    ).length +
    state.interventions.filter(
      (i) => i.status !== 'terminee' && i.status !== 'refusee'
    ).length;

  const handleClientNav = (tab: ClientTab) => {
    setWorkspace('client');
    openEstablishment(null);
    setClientTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWorkspaceChange = (mode: WorkspaceMode) => {
    setWorkspace(mode);
    openEstablishment(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
      {/* Top Bar Contract strict : 3 zones (Wordmark — Nav links — 1 Action primaire) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[52px] sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1 : Wordmark seul */}
          <button
            type="button"
            onClick={() => handleClientNav('discover')}
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {BRAND_CONFIG.appName}
          </button>

          {/* Zone 2 : Liens de navigation texte (4–5 liens) */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
            aria-label="Navigation principale"
          >
            <button
              type="button"
              onClick={() => handleClientNav('discover')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                workspace === 'client' && clientTab === 'discover' && !selectedEstablishmentId
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Découvrir
            </button>
            <button
              type="button"
              onClick={() => handleClientNav('compare')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                workspace === 'client' && clientTab === 'compare'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Comparer
            </button>
            <button
              type="button"
              onClick={() => handleClientNav('services')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                workspace === 'client' && clientTab === 'services'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => handleClientNav('tracking')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                workspace === 'client' && clientTab === 'tracking'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Suivi ({activeTrackingCount})
            </button>
            <button
              type="button"
              onClick={() => handleClientNav('profile')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                workspace === 'client' && (clientTab === 'profile' || clientTab === 'history')
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Profil
            </button>
          </nav>

          {/* Zone 3 : 1 action primaire */}
          <div className="shrink-0">
            {workspace === 'client' ? (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="tabular-nums">Panier ({cartCount})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleWorkspaceChange('client')}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Espace Client
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-24 lg:pb-12 space-y-6">
        {/* Barre d'espaces & accès secondaire (sous le header pour respecter le Top Bar Contract) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            className="inline-flex items-center p-1 bg-slate-200/75 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar"
            role="tablist"
            aria-label="Sélection de l'espace utilisateur"
          >
            <button
              type="button"
              role="tab"
              aria-selected={workspace === 'client'}
              onClick={() => handleWorkspaceChange('client')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                workspace === 'client'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Espace Client</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspace === 'pro'}
              onClick={() => handleWorkspaceChange('pro')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                workspace === 'pro'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Espace Professionnel</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={workspace === 'delivery'}
              onClick={() => handleWorkspaceChange('delivery')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                workspace === 'delivery'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Espace Livreur</span>
            </button>
          </div>

          {workspace === 'client' && (
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => handleClientNav('history')}
                className={`inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer ${
                  clientTab === 'history' ? 'text-teal-800 font-semibold' : ''
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historique ({state.orders.length + state.interventions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => handleClientNav('profile')}
                className={`lg:hidden inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer ${
                  clientTab === 'profile' ? 'text-teal-800 font-semibold' : ''
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profil & Adresses</span>
              </button>
            </div>
          )}
        </div>

        {/* Vues par espace */}
        {workspace === 'client' && (
          <>
            {selectedEstablishmentId ? (
              <EstablishmentDetailView />
            ) : clientTab === 'discover' ? (
              <DiscoverView />
            ) : clientTab === 'compare' ? (
              <PriceComparatorView />
            ) : clientTab === 'services' ? (
              <ServicesProsView />
            ) : clientTab === 'tracking' ? (
              <OrderTrackingView />
            ) : clientTab === 'history' ? (
              <ActivityHistoryView />
            ) : (
              <ProfileSettingsView />
            )}
          </>
        )}

        {workspace === 'pro' && <ProDashboardView />}
        {workspace === 'delivery' && <DeliveryDashboardView />}
      </main>

      {/* Pied de page sobre */}
      <footer className="hidden lg:block bg-white border-t border-slate-200 py-5 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <span>
            {BRAND_CONFIG.appName} — Plateforme de proximité, commerce et services ({BRAND_CONFIG.cityDefault}, {BRAND_CONFIG.countryDefault})
          </span>
          <span>{BRAND_CONFIG.demoNotice}</span>
        </div>
      </footer>

      {/* Barre de navigation mobile fixe (4 onglets, hauteur 56px pour respecter le cap de 15%) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center"
        aria-label="Navigation mobile"
      >
        <button
          type="button"
          onClick={() => handleClientNav('discover')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            workspace === 'client' && clientTab === 'discover' && !selectedEstablishmentId
              ? 'text-teal-700 font-semibold'
              : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Découvrir</span>
        </button>

        <button
          type="button"
          onClick={() => handleClientNav('compare')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            workspace === 'client' && clientTab === 'compare'
              ? 'text-teal-700 font-semibold'
              : 'text-slate-500'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Comparer</span>
        </button>

        <button
          type="button"
          onClick={() => handleClientNav('services')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            workspace === 'client' && clientTab === 'services'
              ? 'text-teal-700 font-semibold'
              : 'text-slate-500'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Services</span>
        </button>

        <button
          type="button"
          onClick={() => handleClientNav('tracking')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            workspace === 'client' && clientTab === 'tracking'
              ? 'text-teal-700 font-semibold'
              : 'text-slate-500'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">
            Suivi ({activeTrackingCount})
          </span>
        </button>
      </nav>

      <CartCheckoutDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
