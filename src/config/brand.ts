export const BRAND_CONFIG = {
  // Identité provisoire facilement remplaçable avant lancement commercial
  appName: 'Projet',
  cityDefault: 'Parakou',
  countryDefault: 'Bénin',
  currencyCode: 'FCFA',
  currencyLocale: 'fr-FR',
  demoNotice:
    'Prototype fonctionnel de démonstration — établissements, prestataires et paiements fictifs inspirés de Parakou.',
  what3wordsNotice:
    'Format compatible 3 mots (simulation locale non connectée à l’API externe what3words).',
  paymentDemoNotice:
    'Paiement de démonstration uniquement : aucune transaction Mobile Money ou bancaire réelle n’est effectuée.',
  futureIntegrations: [
    { key: 'database', label: 'Base de données distante (PostgreSQL / Firestore)', ready: true },
    { key: 'auth', label: 'Authentification OTP Téléphone & Comptes Pro', ready: true },
    { key: 'payment', label: 'Passerelle Mobile Money (MTN MoMo, Moov Money, Celtiis)', ready: true },
    { key: 'maps', label: 'Tuiles cartographiques & API de géocodage temps réel', ready: true },
    { key: 'notifications', label: 'Notifications Push & SMS transactionnels', ready: true },
  ],
} as const;

export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount))} ${BRAND_CONFIG.currencyCode}`;
}
