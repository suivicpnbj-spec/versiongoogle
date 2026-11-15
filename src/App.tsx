import React from 'react';
import {
  ArrowUpRight,
  Compass,
  History,
  MapPin,
  Navigation,
  Scale,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
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

const clientLinks: Array<{ id: ClientTab; label: string; icon: React.ElementType }> = [
  { id: 'discover', label: 'Découvrir', icon: Compass },
  { id: 'compare', label: 'Comparer les prix', icon: Scale },
  { id: 'services', label: 'Services à proximité', icon: Wrench },
  { id: 'tracking', label: 'Mes activités', icon: Navigation },
];

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
    state.orders.filter((o) => o.prepStatus !== 'annulee' && o.deliveryStatus !== 'livree').length +
    state.interventions.filter((i) => i.status !== 'terminee' && i.status !== 'refusee').length;

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

  const activeLabel = selectedEstablishmentId
    ? 'Établissement'
    : clientLinks.find((item) => item.id === clientTab)?.label ?? 'Mon espace';

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#17211c]">
      {/* Navigation latérale inspirée de la piste Figma, branchée sur les états métier Google. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-black/5 bg-[#fbfaf6] px-5 py-6 lg:flex">
        <button
          type="button"
          onClick={() => handleClientNav('discover')}
          className="mb-9 flex items-center gap-3 text-left"
          aria-label="Retour à l'accueil"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[15px] bg-[#0b5d41] text-white shadow-sm">
            <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#e2ff65]" />
            <Navigation className="relative" size={19} />
          </span>
          <span className="font-display text-[21px] font-extrabold tracking-[-0.055em]">
            {BRAND_CONFIG.appName}<span className="text-[#ef6a39]">.</span>
          </span>
        </button>

        <div className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#829087]">
          Explorer
        </div>
        <nav className="space-y-1" aria-label="Navigation principale">
          {clientLinks.map(({ id, label, icon: Icon }) => {
            const active = workspace === 'client' && clientTab === id && !selectedEstablishmentId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleClientNav(id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold transition-colors ${
                  active
                    ? 'bg-[#eaf1e9] text-[#0b5d41]'
                    : 'text-[#65736b] hover:bg-[#f0f1eb] hover:text-[#17211c]'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
                <span className="flex-1">{label}</span>
                {id === 'tracking' && activeTrackingCount > 0 && (
                  <span className="rounded-full bg-[#e2ff65] px-2 py-0.5 text-[10px] font-extrabold text-[#17211c]">
                    {activeTrackingCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleClientNav('history')}
            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold transition-colors ${
              workspace === 'client' && clientTab === 'history'
                ? 'bg-[#eaf1e9] text-[#0b5d41]'
                : 'text-[#65736b] hover:bg-[#f0f1eb] hover:text-[#17211c]'
            }`}
          >
            <History size={18} />
            Historique
          </button>
          <button
            type="button"
            onClick={() => handleClientNav('profile')}
            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold transition-colors ${
              workspace === 'client' && clientTab === 'profile'
                ? 'bg-[#eaf1e9] text-[#0b5d41]'
                : 'text-[#65736b] hover:bg-[#f0f1eb] hover:text-[#17211c]'
            }`}
          >
            <UserRound size={18} />
            Profil & adresses
          </button>
        </nav>

        <div className="mb-3 mt-9 px-3 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#829087]">
          Espaces de travail
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleWorkspaceChange('pro')}
            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold transition-colors ${
              workspace === 'pro' ? 'bg-[#0b5d41] text-white' : 'text-[#65736b] hover:bg-[#f0f1eb]'
            }`}
          >
            <Store size={18} />
            Espace professionnel
          </button>
          <button
            type="button"
            onClick={() => handleWorkspaceChange('delivery')}
            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold transition-colors ${
              workspace === 'delivery' ? 'bg-[#0b5d41] text-white' : 'text-[#65736b] hover:bg-[#f0f1eb]'
            }`}
          >
            <Truck size={18} />
            Espace livraison
          </button>
        </div>

        <div className="mt-auto rounded-[22px] bg-[#153e2d] p-4 text-white">
          <div className="flex items-center gap-2 text-[#e2ff65]">
            <MapPin size={15} />
            <span className="text-[10px] font-extrabold uppercase tracking-[.14em]">Zone de démonstration</span>
          </div>
          <p className="mt-2 font-display text-lg font-extrabold">{BRAND_CONFIG.cityDefault}</p>
          <p className="mt-1 text-[11px] leading-5 text-white/65">
            {BRAND_CONFIG.countryDefault} · Données fictives de démonstration
          </p>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fbfaf6]/95 backdrop-blur-xl">
          <div className="mx-auto flex h-[66px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => handleClientNav('discover')}
                className="flex items-center gap-2 lg:hidden"
                aria-label="Accueil"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#0b5d41] text-white">
                  <Navigation size={17} />
                </span>
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#829087]">
                  {workspace === 'client' ? 'Espace client' : workspace === 'pro' ? 'Espace professionnel' : 'Espace livraison'}
                </p>
                <h1 className="truncate font-display text-[16px] font-extrabold tracking-[-.035em] sm:text-lg">
                  {workspace === 'client' ? activeLabel : workspace === 'pro' ? 'Gestion de votre activité' : 'Livraisons attribuées'}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full bg-[#eaf1e9] px-3 py-2 text-[11px] font-bold text-[#0b5d41] sm:inline-flex">
                <MapPin size={13} /> {BRAND_CONFIG.cityDefault}
              </span>
              {workspace === 'client' ? (
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b5d41] px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#084b35] sm:px-4 sm:text-sm"
                >
                  <ShoppingBag size={16} />
                  <span>Panier</span>
                  <span className="rounded-lg bg-white/15 px-1.5 py-0.5 tabular-nums">{cartCount}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleWorkspaceChange('client')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#e2ff65] px-4 text-xs font-extrabold text-[#17211c] transition hover:bg-[#d6f34e]"
                >
                  Espace client <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 pb-28 sm:px-7 sm:py-8 lg:px-10 lg:pb-12">
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

          <footer className="mt-12 hidden items-center justify-between gap-4 border-t border-black/5 pt-5 text-[11px] text-[#829087] lg:flex">
            <span>{BRAND_CONFIG.appName} · Commerce et services de proximité · {BRAND_CONFIG.cityDefault}</span>
            <span>{BRAND_CONFIG.demoNotice}</span>
          </footer>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-[66px] grid-cols-4 border-t border-black/5 bg-[#fbfaf6]/95 backdrop-blur-xl lg:hidden"
        aria-label="Navigation mobile"
      >
        {[
          { id: 'discover' as ClientTab, label: 'Découvrir', icon: Compass },
          { id: 'compare' as ClientTab, label: 'Comparer', icon: Scale },
          { id: 'services' as ClientTab, label: 'Services', icon: Wrench },
          { id: 'tracking' as ClientTab, label: 'Suivi', icon: Navigation },
        ].map(({ id, label, icon: Icon }) => {
          const active = workspace === 'client' && clientTab === id && !selectedEstablishmentId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClientNav(id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-[#0b5d41]' : 'text-[#87938b]'
              }`}
            >
              <span className={`flex h-8 w-11 items-center justify-center rounded-full ${
                active ? 'bg-[#eaf1e9]' : ''
              }`}>
                <Icon size={19} strokeWidth={active ? 2.5 : 1.9} />
              </span>
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          );
        })}
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
