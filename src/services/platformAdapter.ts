import { AppStateData, DeliveryLocation, Order } from '../types/domain';

const STORAGE_KEY = 'projet_parakou_state_v1';

/**
 * Interface d'architecture prête pour le branchement ultérieur
 * d'une base de données distante, d'un module Mobile Money,
 * d'une API cartographique et d'un service de notifications.
 */
export interface PlatformBackendAdapter {
  loadState: (fallback: AppStateData) => AppStateData;
  saveState: (state: AppStateData) => void;
  clearState: () => void;
  simulateDemoPayment: (
    method: 'momo_demo' | 'moov_demo' | 'cash_demo',
    amountFcfa: number
  ) => { status: Order['paymentStatus']; reference: string; label: string };
  formatShareableLocation: (loc: DeliveryLocation) => string;
}

export const localPlatformAdapter: PlatformBackendAdapter = {
  loadState(fallback) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<AppStateData>;
      if (
        !parsed ||
        !Array.isArray(parsed.establishments) ||
        !Array.isArray(parsed.offers) ||
        !Array.isArray(parsed.pros)
      ) {
        return fallback;
      }
      return {
        ...fallback,
        ...parsed,
      };
    } catch {
      return fallback;
    }
  },

  saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in private browsing mode
    }
  },

  clearState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  },

  simulateDemoPayment(method, _amountFcfa) {
    const ref = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    if (method === 'cash_demo') {
      return {
        status: 'demo_a_la_livraison',
        reference: ref,
        label: 'Espèces à la réception (Démo)',
      };
    }
    if (method === 'moov_demo') {
      return {
        status: 'demo_valide',
        reference: ref,
        label: 'Moov Money (Simulation démo)',
      };
    }
    return {
      status: 'demo_valide',
      reference: ref,
      label: 'MTN MoMo (Simulation démo)',
    };
  },

  formatShareableLocation(loc) {
    return [
      `Point de livraison — Parakou (${loc.neighborhood})`,
      `Adresse : ${loc.textAddress || 'Non précisée'}`,
      `Code 3 mots (format compatible démo) : ${loc.threeWordCode}`,
      `Indications d'accès : ${loc.accessInstructions || 'Aucune précision'}`,
      `Coordonnées : ${loc.coordinates.lat.toFixed(5)}, ${loc.coordinates.lng.toFixed(5)}`,
    ].join('\n');
  },
};
