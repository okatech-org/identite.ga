import { idnTokens } from '@/design/tokens';

export type Category = { k: string; iconName: 'globe' | 'user' | 'tax' | 'edu' | 'health' | 'shield'; c: number };

export const CATEGORIES: Category[] = [
  { k: 'Consulaire', iconName: 'globe',  c: 6 },
  { k: 'État civil', iconName: 'user',   c: 5 },
  { k: 'Fiscalité',  iconName: 'tax',    c: 3 },
  { k: 'Éducation',  iconName: 'edu',    c: 4 },
  { k: 'Santé',      iconName: 'health', c: 3 },
  { k: 'Justice',    iconName: 'shield', c: 2 },
];

export type Service = { id: string; l: string; sub: string; col: string; b?: string };

export const POPULAR_SERVICES: Service[] = [
  { id: 'evisa',     l: 'e-Visa Tourisme',         sub: 'Consulat.ga · Niv. 1',           col: idnTokens.blue,  b: 'New' },
  { id: 'naissance', l: 'Acte de naissance',       sub: 'État civil · Niv. 3',            col: idnTokens.green },
  { id: 'cni',       l: 'Renouvellement CNI',      sub: 'Intérieur · Niv. 3',             col: idnTokens.green },
  { id: 'revenus',   l: 'Déclaration de revenus',  sub: 'DGI · Niv. 2',                   col: idnTokens.green },
  { id: 'bourses',   l: 'Bourses étudiantes',      sub: 'Enseign. sup. · Niv. 3',         col: idnTokens.green },
  { id: 'cnamgs',    l: 'Carte CNAMGS',            sub: 'Santé.ga · Niv. 3',              col: idnTokens.green },
];

export const ONGOING_SERVICES = [
  { id: 'evisa',     l: 'e-Visa Tourisme',           org: 'Consulat.ga',         status: 'En instruction',      col: idnTokens.blue,   pct: 60 },
  { id: 'passeport', l: 'Renouvellement passeport', org: 'Affaires étrangères', status: 'Documents à fournir', col: idnTokens.yellow, pct: 30 },
] as const;

export const SUGGESTED = [
  { l: 'Acte de naissance', sub: 'État civil', col: '#E8DCC4' },
  { l: 'Quitus fiscal',     sub: 'DGI',        col: '#C4DCE8' },
  { l: 'Santé.ga',          sub: 'e-santé',    col: '#C4E8D2' },
] as const;

export const E_VISA_DETAIL = {
  org: 'CONSULAT.GA',
  title: 'e-Visa Tourisme',
  stats: [
    { label: 'Délai moyen', value: '48h' },
    { label: 'Coût',        value: '40 000 FCFA' },
    { label: 'LoA min.',    value: '1' },
  ],
  description:
    'Visa touristique pour les ressortissants étrangers souhaitant visiter le Gabon. Validité 30 ou 90 jours, entrée unique ou multiple. Demande instruite par les services consulaires.',
  pieces: [
    { l: 'Passeport en cours de validité', ok: true },
    { l: 'Photo d\'identité récente',      ok: true },
    { l: 'Justificatif d\'hébergement',    ok: false },
    { l: 'Billet retour',                  ok: false },
  ],
};
