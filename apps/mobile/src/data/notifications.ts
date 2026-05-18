import { idnTokens } from '@/design/tokens';

export type Notif = {
  cat: string;
  e: string;
  m: string;
  ts: string;
  col: string;
  warn?: boolean;
  unread?: boolean;
};

export const NOTIF_GROUPS: { d: string; items: Notif[] }[] = [
  { d: 'Aujourd\'hui', items: [
    { cat: 'KYC',      e: 'Votre niveau de garantie est passé à 3', m: 'Validé par le contrôleur K. Ovono.',         ts: '09:14', col: idnTokens.green,  unread: true },
    { cat: 'SÉCURITÉ', e: 'Nouvelle connexion détectée',            m: 'Firefox Linux · Paris, FR · 81.92.144.7',    ts: '08:42', col: idnTokens.yellow, warn: true, unread: true },
  ]},
  { d: 'Cette semaine', items: [
    { cat: 'SERVICE', e: 'e-Visa Tourisme : pièces à compléter',    m: 'Ajoutez un justificatif d\'hébergement',     ts: 'Hier',  col: idnTokens.blue },
    { cat: 'CONS.',   e: 'Consentement accordé à Bourses Étudiantes', m: 'Vous pouvez le révoquer à tout moment',     ts: '08 mai', col: '#74766B' },
  ]},
];
