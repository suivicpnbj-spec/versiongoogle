import React from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  PackageCheck,
  AlertCircle,
  XCircle,
  Wallet,
} from 'lucide-react';
import {
  DeliveryStatus,
  InterventionStatus,
  OrderPrepStatus,
  PaymentDemoStatus,
} from '../../types/domain';

// Signalisation sans dépendance à la couleur seule et sans capsules/pills décoratives
export const PrepStatusLabel: React.FC<{ status: OrderPrepStatus }> = ({ status }) => {
  const map: Record<OrderPrepStatus, { label: string; color: string; Icon: React.ElementType }> = {
    nouvelle: { label: 'Nouvelle commande', color: 'text-amber-700', Icon: Clock },
    confirmee: { label: 'Confirmée par le commerce', color: 'text-teal-700', Icon: CheckCircle2 },
    en_preparation: { label: 'En préparation', color: 'text-teal-700', Icon: Clock },
    prete: { label: 'Prête', color: 'text-emerald-700', Icon: PackageCheck },
    annulee: { label: 'Annulée', color: 'text-rose-700', Icon: XCircle },
  };
  const cfg = map[status];
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

export const PaymentStatusLabel: React.FC<{ status: PaymentDemoStatus }> = ({ status }) => {
  const map: Record<PaymentDemoStatus, { label: string; color: string }> = {
    demo_en_attente: { label: 'Paiement en attente (démo)', color: 'text-amber-700' },
    demo_valide: { label: 'Payé — simulation démo', color: 'text-emerald-700' },
    demo_a_la_livraison: { label: 'À régler à la réception (démo)', color: 'text-slate-700' },
  };
  const cfg = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Wallet className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

export const DeliveryStatusLabel: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  const map: Record<DeliveryStatus, { label: string; color: string; Icon: React.ElementType }> = {
    non_requis: { label: 'Retrait / sur place', color: 'text-slate-600', Icon: PackageCheck },
    en_attente_livreur: { label: 'En attente de livreur', color: 'text-amber-700', Icon: Clock },
    attribuee: { label: 'Livreur assigné', color: 'text-teal-700', Icon: Navigation },
    en_route_retrait: { label: 'Livreur en route vers le point de retrait', color: 'text-teal-700', Icon: Navigation },
    en_livraison: { label: 'En cours de livraison', color: 'text-teal-700', Icon: Navigation },
    livree: { label: 'Livrée', color: 'text-emerald-700', Icon: CheckCircle2 },
  };
  const cfg = map[status];
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};

export const InterventionStatusLabel: React.FC<{ status: InterventionStatus }> = ({ status }) => {
  const map: Record<InterventionStatus, { label: string; color: string; Icon: React.ElementType }> = {
    envoyee: { label: 'Demande envoyée', color: 'text-amber-700', Icon: Clock },
    acceptee: { label: 'Demande acceptée', color: 'text-teal-700', Icon: CheckCircle2 },
    en_route: { label: 'Professionnel en route', color: 'text-teal-700', Icon: Navigation },
    sur_place: { label: 'Arrivé sur place', color: 'text-emerald-700', Icon: CheckCircle2 },
    terminee: { label: 'Intervention terminée', color: 'text-emerald-700', Icon: PackageCheck },
    refusee: { label: 'Indisponible / refusée', color: 'text-rose-700', Icon: AlertCircle },
  };
  const cfg = map[status];
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};
