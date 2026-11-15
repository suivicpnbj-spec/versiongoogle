import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { INITIAL_SEED_STATE } from '../data/parakouSeed';
import { localPlatformAdapter } from '../services/platformAdapter';
import {
  AppStateData,
  CartItem,
  ClientTab,
  CustomerProfile,
  DeliveryLocation,
  DeliveryStatus,
  DishOption,
  Establishment,
  FulfillmentMode,
  InterventionRequest,
  InterventionStatus,
  Order,
  OrderPrepStatus,
  ProServiceProfile,
  ProductOffer,
  WorkspaceMode,
} from '../types/domain';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

interface PlaceOrderPayload {
  establishmentId: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMode: FulfillmentMode;
  location?: DeliveryLocation;
  paymentMethod: 'momo_demo' | 'moov_demo' | 'cash_demo';
}

interface CreateInterventionPayload {
  proId: string;
  customerName: string;
  customerPhone: string;
  problemDescription: string;
  location: DeliveryLocation;
}

interface AppContextValue {
  state: AppStateData;
  workspace: WorkspaceMode;
  setWorkspace: (mode: WorkspaceMode) => void;
  clientTab: ClientTab;
  setClientTab: (tab: ClientTab) => void;
  selectedEstablishmentId: string | null;
  openEstablishment: (id: string | null) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  openCompareWithQuery: (q: string) => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    offer: ProductOffer,
    quantity?: number,
    selectedOptions?: DishOption[],
    note?: string
  ) => void;
  updateCartQuantity: (lineId: string, delta: number) => void;
  removeCartLine: (lineId: string) => void;
  clearMerchantCart: (establishmentId: string) => void;
  placeOrder: (payload: PlaceOrderPayload) => Order | null;
  createIntervention: (payload: CreateInterventionPayload) => InterventionRequest | null;
  // Espace Professionnel
  setActiveProEstablishmentId: (id: string) => void;
  updateEstablishmentProfile: (id: string, patch: Partial<Establishment>) => void;
  addOffer: (offer: Omit<ProductOffer, 'id' | 'updatedAt'>) => void;
  updateOffer: (offerId: string, patch: Partial<ProductOffer>) => void;
  updateOrderPrepStatus: (orderId: string, status: OrderPrepStatus) => void;
  toggleProAvailability: (proId: string) => void;
  updateProProfile: (proId: string, patch: Partial<ProServiceProfile>) => void;
  updateInterventionStatus: (
    interventionId: string,
    status: InterventionStatus,
    note?: string
  ) => void;
  // Espace Livraison & Simulation temps réel
  updateDeliveryStatus: (orderId: string, status: DeliveryStatus, driverName?: string) => void;
  setOrderDriverProgress: (orderId: string, progress: number) => void;
  setInterventionProProgress: (interventionId: string, progress: number) => void;
  liveSimulationRunning: boolean;
  setLiveSimulationRunning: (running: boolean) => void;
  // Profil & Paramètres
  updateCustomerProfile: (patch: Partial<CustomerProfile>) => void;
  addSavedAddress: (title: string, location: DeliveryLocation) => void;
  removeSavedAddress: (id: string) => void;
  resetDemoData: () => void;
  // Notifications UI
  toasts: ToastMessage[];
  notify: (text: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppStateData>(() =>
    localPlatformAdapter.loadState(INITIAL_SEED_STATE)
  );
  const [workspace, setWorkspace] = useState<WorkspaceMode>('client');
  const [clientTab, setClientTab] = useState<ClientTab>('discover');
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [liveSimulationRunning, setLiveSimulationRunning] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localPlatformAdapter.saveState(state);
  }, [state]);

  const notify = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Simulation fluide des déplacements (livreurs en cours et pros en route)
  useEffect(() => {
    if (!liveSimulationRunning) return;
    const timer = window.setInterval(() => {
      setState((prev) => {
        let changed = false;
        const nextOrders = prev.orders.map((ord) => {
          if (ord.deliveryStatus === 'en_livraison' && ord.driverProgress < 100) {
            changed = true;
            const nextProg = Math.min(100, ord.driverProgress + 2);
            return {
              ...ord,
              driverProgress: nextProg,
              deliveryStatus: nextProg >= 100 ? ('livree' as const) : ord.deliveryStatus,
            };
          }
          return ord;
        });

        const nextInterventions = prev.interventions.map((intv) => {
          if (intv.status === 'en_route' && intv.proProgress < 100) {
            changed = true;
            const nextProg = Math.min(100, intv.proProgress + 2);
            return {
              ...intv,
              proProgress: nextProg,
              status: nextProg >= 100 ? ('sur_place' as const) : intv.status,
              estimatedArrivalMin: Math.max(1, Math.round(((100 - nextProg) / 100) * 18)),
            };
          }
          return intv;
        });

        if (!changed) return prev;
        return { ...prev, orders: nextOrders, interventions: nextInterventions };
      });
    }, 1200);

    return () => window.clearInterval(timer);
  }, [liveSimulationRunning]);

  const openEstablishment = useCallback((id: string | null) => {
    setSelectedEstablishmentId(id);
    if (id) {
      setWorkspace('client');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openCompareWithQuery = useCallback((q: string) => {
    setGlobalSearchQuery(q);
    setSelectedEstablishmentId(null);
    setWorkspace('client');
    setClientTab('compare');
  }, []);

  const addToCart = useCallback(
    (
      offer: ProductOffer,
      quantity = 1,
      selectedOptions: DishOption[] = [],
      note?: string
    ) => {
      if (!offer.inStock) {
        notify('Cet article est actuellement en rupture de stock.', 'warning');
        return;
      }
      const optionKey = selectedOptions
        .map((o) => o.id)
        .sort()
        .join(',');
      const lineId = `${offer.id}__${optionKey}__${note || ''}`;
      const optionsExtra = selectedOptions.reduce((sum, o) => sum + o.extraFcfa, 0);
      const unitPriceFcfa = offer.priceFcfa + optionsExtra;

      setCart((prev) => {
        const existing = prev.find((item) => item.id === lineId);
        if (existing) {
          return prev.map((item) =>
            item.id === lineId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [
          ...prev,
          {
            id: lineId,
            offerId: offer.id,
            establishmentId: offer.establishmentId,
            productName: offer.productName,
            packagingLabel: offer.packagingLabel,
            unitPriceFcfa,
            quantity,
            selectedOptions,
            note,
          },
        ];
      });

      notify(`${offer.productName} (${offer.packagingLabel}) ajouté au panier.`, 'success');
    },
    [notify]
  );

  const updateCartQuantity = useCallback((lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeCartLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== lineId));
  }, []);

  const clearMerchantCart = useCallback((establishmentId: string) => {
    setCart((prev) => prev.filter((item) => item.establishmentId !== establishmentId));
  }, []);

  const placeOrder = useCallback(
    (payload: PlaceOrderPayload): Order | null => {
      const est = state.establishments.find((e) => e.id === payload.establishmentId);
      const merchantItems = cart.filter((c) => c.establishmentId === payload.establishmentId);
      if (!est || merchantItems.length === 0) return null;

      const subtotalFcfa = merchantItems.reduce(
        (sum, item) => sum + item.unitPriceFcfa * item.quantity,
        0
      );
      const deliveryFeeFcfa = payload.fulfillmentMode === 'livraison' ? 500 : 0;
      const totalFcfa = subtotalFcfa + deliveryFeeFcfa;

      const paymentSim = localPlatformAdapter.simulateDemoPayment(
        payload.paymentMethod,
        totalFcfa
      );

      const newOrder: Order = {
        id: `CMD-${Math.floor(4100 + Math.random() * 5800)}`,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        establishmentId: est.id,
        establishmentName: est.name,
        establishmentCategory: est.category,
        items: merchantItems,
        subtotalFcfa,
        deliveryFeeFcfa,
        totalFcfa,
        fulfillmentMode: payload.fulfillmentMode,
        location: payload.location,
        estimatedPrepMin: est.prepTimeMin ?? 15,
        prepStatus: 'nouvelle',
        paymentStatus: paymentSim.status,
        paymentMethodLabel: paymentSim.label,
        deliveryStatus:
          payload.fulfillmentMode === 'livraison' ? 'en_attente_livreur' : 'non_requis',
        driverProgress: 0,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        orders: [newOrder, ...prev.orders],
      }));
      clearMerchantCart(est.id);
      setCartOpen(false);
      setSelectedEstablishmentId(null);
      setClientTab('tracking');
      notify(`Commande ${newOrder.id} transmise à ${est.name}.`, 'success');
      return newOrder;
    },
    [cart, clearMerchantCart, notify, state.establishments]
  );

  const createIntervention = useCallback(
    (payload: CreateInterventionPayload): InterventionRequest | null => {
      const pro = state.pros.find((p) => p.id === payload.proId);
      if (!pro) return null;

      const newReq: InterventionRequest = {
        id: `INT-${Math.floor(300 + Math.random() * 699)}`,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        proId: pro.id,
        proName: pro.proName,
        specialty: pro.specialty,
        specialtyLabel: pro.specialtyLabel,
        problemDescription: payload.problemDescription,
        location: payload.location,
        status: 'envoyee',
        estimatedArrivalMin: pro.responseTimeMin,
        proProgress: 0,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        interventions: [newReq, ...prev.interventions],
      }));
      setClientTab('tracking');
      notify(`Demande ${newReq.id} envoyée à ${pro.proName}.`, 'success');
      return newReq;
    },
    [notify, state.pros]
  );

  const setActiveProEstablishmentId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeProEstablishmentId: id }));
  }, []);

  const updateEstablishmentProfile = useCallback(
    (id: string, patch: Partial<Establishment>) => {
      setState((prev) => ({
        ...prev,
        establishments: prev.establishments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
      notify('Fiche établissement mise à jour.', 'success');
    },
    [notify]
  );

  const addOffer = useCallback(
    (offerData: Omit<ProductOffer, 'id' | 'updatedAt'>) => {
      const newOffer: ProductOffer = {
        ...offerData,
        id: `off-${Date.now().toString(36)}`,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setState((prev) => ({
        ...prev,
        offers: [newOffer, ...prev.offers],
      }));
      notify(`"${newOffer.productName}" publié dans le catalogue.`, 'success');
    },
    [notify]
  );

  const updateOffer = useCallback(
    (offerId: string, patch: Partial<ProductOffer>) => {
      setState((prev) => ({
        ...prev,
        offers: prev.offers.map((o) =>
          o.id === offerId
            ? { ...o, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }
            : o
        ),
      }));
      notify('Tarif et disponibilité mis à jour en direct.', 'success');
    },
    [notify]
  );

  const updateOrderPrepStatus = useCallback(
    (orderId: string, prepStatus: OrderPrepStatus) => {
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((ord) => {
          if (ord.id !== orderId) return ord;
          let deliveryStatus = ord.deliveryStatus;
          if (
            prepStatus === 'prete' &&
            ord.fulfillmentMode === 'livraison' &&
            ord.deliveryStatus === 'en_attente_livreur'
          ) {
            deliveryStatus = 'attribuee';
          }
          return {
            ...ord,
            prepStatus,
            deliveryStatus,
            driverName:
              deliveryStatus === 'attribuee' && !ord.driverName
                ? 'Moussa Orou (Moto Zémidjan Pro)'
                : ord.driverName,
          };
        }),
      }));
      notify(`Commande ${orderId} mise à jour.`, 'info');
    },
    [notify]
  );

  const toggleProAvailability = useCallback(
    (proId: string) => {
      setState((prev) => ({
        ...prev,
        pros: prev.pros.map((p) =>
          p.id === proId ? { ...p, availableNow: !p.availableNow } : p
        ),
      }));
      notify('Disponibilité du professionnel actualisée.', 'info');
    },
    [notify]
  );

  const updateProProfile = useCallback(
    (proId: string, patch: Partial<ProServiceProfile>) => {
      setState((prev) => ({
        ...prev,
        pros: prev.pros.map((p) => (p.id === proId ? { ...p, ...patch } : p)),
      }));
      notify('Profil prestataire enregistré.', 'success');
    },
    [notify]
  );

  const updateInterventionStatus = useCallback(
    (interventionId: string, status: InterventionStatus, proNote?: string) => {
      setState((prev) => ({
        ...prev,
        interventions: prev.interventions.map((intv) => {
          if (intv.id !== interventionId) return intv;
          let proProgress = intv.proProgress;
          if (status === 'en_route' && proProgress === 0) proProgress = 12;
          if (status === 'sur_place' || status === 'terminee') proProgress = 100;
          return {
            ...intv,
            status,
            proProgress,
            proNote: proNote ?? intv.proNote,
          };
        }),
      }));
      notify(`Intervention ${interventionId} actualisée.`, 'info');
    },
    [notify]
  );

  const updateDeliveryStatus = useCallback(
    (orderId: string, deliveryStatus: DeliveryStatus, driverName?: string) => {
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((ord) => {
          if (ord.id !== orderId) return ord;
          let driverProgress = ord.driverProgress;
          if (deliveryStatus === 'en_livraison' && driverProgress < 10) driverProgress = 15;
          if (deliveryStatus === 'livree') driverProgress = 100;
          return {
            ...ord,
            deliveryStatus,
            driverProgress,
            driverName: driverName ?? ord.driverName ?? 'Moussa Orou (Moto Zémidjan Pro)',
          };
        }),
      }));
      notify(`Livraison ${orderId} : statut mis à jour.`, 'info');
    },
    [notify]
  );

  const setOrderDriverProgress = useCallback((orderId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              driverProgress: clamped,
              deliveryStatus: clamped >= 100 ? 'livree' : 'en_livraison',
            }
          : ord
      ),
    }));
  }, []);

  const setInterventionProProgress = useCallback((interventionId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    setState((prev) => ({
      ...prev,
      interventions: prev.interventions.map((intv) =>
        intv.id === interventionId
          ? {
              ...intv,
              proProgress: clamped,
              status: clamped >= 100 ? 'sur_place' : 'en_route',
            }
          : intv
      ),
    }));
  }, []);

  const updateCustomerProfile = useCallback(
    (patch: Partial<CustomerProfile>) => {
      setState((prev) => ({
        ...prev,
        customerProfile: { ...prev.customerProfile, ...patch },
      }));
      notify('Profil client enregistré.', 'success');
    },
    [notify]
  );

  const addSavedAddress = useCallback(
    (title: string, location: DeliveryLocation) => {
      const newAddr = {
        id: `addr-${Date.now().toString(36)}`,
        title,
        location,
      };
      setState((prev) => ({
        ...prev,
        customerProfile: {
          ...prev.customerProfile,
          savedAddresses: [newAddr, ...prev.customerProfile.savedAddresses],
        },
      }));
      notify(`Adresse "${title}" enregistrée.`, 'success');
    },
    [notify]
  );

  const removeSavedAddress = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        customerProfile: {
          ...prev.customerProfile,
          savedAddresses: prev.customerProfile.savedAddresses.filter((a) => a.id !== id),
        },
      }));
      notify('Adresse supprimée.', 'info');
    },
    [notify]
  );

  const resetDemoData = useCallback(() => {
    localPlatformAdapter.clearState();
    setState(INITIAL_SEED_STATE);
    setCart([]);
    setSelectedEstablishmentId(null);
    notify('Données de démonstration réinitialisées.', 'info');
  }, [notify]);

  return (
    <AppContext.Provider
      value={{
        state,
        workspace,
        setWorkspace,
        clientTab,
        setClientTab,
        selectedEstablishmentId,
        openEstablishment,
        globalSearchQuery,
        setGlobalSearchQuery,
        openCompareWithQuery,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQuantity,
        removeCartLine,
        clearMerchantCart,
        placeOrder,
        createIntervention,
        setActiveProEstablishmentId,
        updateEstablishmentProfile,
        addOffer,
        updateOffer,
        updateOrderPrepStatus,
        toggleProAvailability,
        updateProProfile,
        updateInterventionStatus,
        updateDeliveryStatus,
        setOrderDriverProgress,
        setInterventionProProgress,
        liveSimulationRunning,
        setLiveSimulationRunning,
        updateCustomerProfile,
        addSavedAddress,
        removeSavedAddress,
        resetDemoData,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}
