export type WorkspaceMode = 'client' | 'pro' | 'delivery';

export type ClientTab =
  | 'discover'
  | 'compare'
  | 'services'
  | 'tracking'
  | 'history'
  | 'profile';

export type EstablishmentCategory =
  | 'supermarche'
  | 'alimentation'
  | 'restaurant'
  | 'patisserie'
  | 'hotel'
  | 'boutique'
  | 'service';

export type ProSpecialty =
  | 'mecanicien'
  | 'vulcanisateur'
  | 'plombier'
  | 'reparateur'
  | 'electricien'
  | 'menuisier';

export interface Coordinates {
  x: number; // 0..1000 sur la carte vectorielle de Parakou
  y: number; // 0..700 sur la carte vectorielle de Parakou
  lat: number;
  lng: number;
}

export interface DeliveryLocation {
  coordinates: Coordinates;
  neighborhood: string;
  textAddress: string;
  accessInstructions: string;
  threeWordCode: string;
  label?: string;
  gpsSource?: 'browser_gps' | 'map_pin' | 'preset';
}

export interface DishOption {
  id: string;
  label: string;
  extraFcfa: number;
}

export interface Establishment {
  id: string;
  name: string;
  category: EstablishmentCategory;
  neighborhood: string;
  address: string;
  hours: string;
  phone: string;
  description: string;
  prepTimeMin?: number;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  supportsDineIn: boolean;
  coordinates: Coordinates;
  imageUrl?: string;
  isOpen: boolean;
  isFictionalDemo: true;
}

export interface ProductOffer {
  id: string;
  establishmentId: string;
  productName: string;
  brandOrOrigin: string;
  category:
    | 'epicerie'
    | 'frais'
    | 'boissons'
    | 'plats'
    | 'patisserie'
    | 'hebergement'
    | 'equipement';
  packagingLabel: string; // Ex: "Sac 5 kg", "Mesure 1 kg", "Sachet 500 g"
  unitGroupKey: string; // Clé stricte de comparaison pour ne jamais mélanger des conditionnements différents
  priceFcfa: number;
  inStock: boolean;
  stockQty: number;
  updatedAt: string; // YYYY-MM-DD
  description: string;
  imageUrl?: string;
  options?: DishOption[];
}

export interface ProServiceProfile {
  id: string;
  establishmentId: string;
  proName: string;
  specialty: ProSpecialty;
  specialtyLabel: string;
  neighborhood: string;
  availableNow: boolean;
  indicativeRateFcfa: number;
  rateUnit: string; // Ex: "dès / intervention", "tarif horaire indicatif"
  servicesList: string[];
  coordinates: Coordinates;
  responseTimeMin: number;
  phone: string;
  bio: string;
}

export interface CartItem {
  id: string; // unique line id (offerId + options hash)
  offerId: string;
  establishmentId: string;
  productName: string;
  packagingLabel: string;
  unitPriceFcfa: number;
  quantity: number;
  selectedOptions: DishOption[];
  note?: string;
}

export type FulfillmentMode = 'livraison' | 'retrait' | 'sur_place';

export type OrderPrepStatus =
  | 'nouvelle'
  | 'confirmee'
  | 'en_preparation'
  | 'prete'
  | 'annulee';

export type PaymentDemoStatus =
  | 'demo_en_attente'
  | 'demo_valide'
  | 'demo_a_la_livraison';

export type DeliveryStatus =
  | 'non_requis'
  | 'en_attente_livreur'
  | 'attribuee'
  | 'en_route_retrait'
  | 'en_livraison'
  | 'livree';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  establishmentId: string;
  establishmentName: string;
  establishmentCategory: EstablishmentCategory;
  items: CartItem[];
  subtotalFcfa: number;
  deliveryFeeFcfa: number;
  totalFcfa: number;
  fulfillmentMode: FulfillmentMode;
  location?: DeliveryLocation;
  estimatedPrepMin?: number;
  prepStatus: OrderPrepStatus;
  paymentStatus: PaymentDemoStatus;
  paymentMethodLabel: string;
  deliveryStatus: DeliveryStatus;
  driverName?: string;
  driverProgress: number; // 0..100
  createdAt: string;
}

export type InterventionStatus =
  | 'envoyee'
  | 'acceptee'
  | 'en_route'
  | 'sur_place'
  | 'terminee'
  | 'refusee';

export interface InterventionRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  proId: string;
  proName: string;
  specialty: ProSpecialty;
  specialtyLabel: string;
  problemDescription: string;
  location: DeliveryLocation;
  status: InterventionStatus;
  estimatedArrivalMin?: number;
  proProgress: number; // 0..100
  proNote?: string;
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  title: string;
  location: DeliveryLocation;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  defaultNeighborhood: string;
  savedAddresses: SavedAddress[];
}

export interface AppStateData {
  establishments: Establishment[];
  offers: ProductOffer[];
  pros: ProServiceProfile[];
  orders: Order[];
  interventions: InterventionRequest[];
  customerProfile: CustomerProfile;
  activeProEstablishmentId: string;
}
