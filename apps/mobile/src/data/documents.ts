import type { IconName } from '@/design/icons';

export type DocFolder = {
  id: string;
  label: string;
  desc: string;
  icon: IconName;
  grad: [string, string];
  count: number;
};

export const DOC_FOLDERS: DocFolder[] = [
  { id: 'identity',     label: 'Identité',   desc: 'CNI, Passeport, Carte de séjour', icon: 'user',      grad: ['#3b82f6', '#4338ca'], count: 3 },
  { id: 'civil_status', label: 'État Civil', desc: 'Naissance, mariage, divorce',     icon: 'baby',      grad: ['#ec4899', '#e11d48'], count: 2 },
  { id: 'residence',    label: 'Domicile',   desc: 'Justificatif, factures',          icon: 'home',      grad: ['#10b981', '#0d9488'], count: 1 },
  { id: 'education',    label: 'Diplômes',   desc: 'Certificats, attestations',       icon: 'cap',       grad: ['#f59e0b', '#ea580c'], count: 4 },
  { id: 'work',         label: 'Travail',    desc: 'Contrats, bulletins',             icon: 'briefcase', grad: ['#a855f7', '#7e22ce'], count: 5 },
  { id: 'health',       label: 'Santé',      desc: 'CNAMGS, ordonnances',             icon: 'heart',     grad: ['#ef4444', '#e11d48'], count: 2 },
  { id: 'vehicle',      label: 'Véhicule',   desc: 'Permis, carte grise',             icon: 'car',       grad: ['#06b6d4', '#2563eb'], count: 2 },
  { id: 'other',        label: 'Autres',     desc: 'Documents divers',                icon: 'file',      grad: ['#64748b', '#475569'], count: 0 },
];

export type IdentityDoc = {
  id: string;
  name: string;
  fileType: 'image' | 'pdf';
  side?: 'front' | 'back';
  status: 'verified' | 'pending';
  expiresIn?: string;
};

export const IDENTITY_DOCS: IdentityDoc[] = [
  { id: 'D1', name: 'CNI · Recto', fileType: 'image', side: 'front', status: 'verified', expiresIn: '4 ans' },
  { id: 'D2', name: 'CNI · Verso', fileType: 'image', side: 'back',  status: 'verified', expiresIn: '4 ans' },
  { id: 'D3', name: 'Passeport',   fileType: 'pdf',                  status: 'verified', expiresIn: '3 ans' },
];

export type RequestableDoc = {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  desc: string;
  delai: string;
  prix: string;
};

export const REQUESTABLE_DOCS: RequestableDoc[] = [
  { id: 'birth',     label: 'Acte de Naissance',    icon: 'baby',  color: '#ec4899', desc: 'Copie intégrale ou extrait', delai: '3-5 jours',  prix: '2 500 FCFA' },
  { id: 'criminal',  label: 'Casier Judiciaire',    icon: 'scale', color: '#a855f7', desc: 'Bulletin n°3',                delai: '5-7 jours',  prix: '5 000 FCFA' },
  { id: 'driving',   label: 'Permis de Conduire',   icon: 'car',   color: '#f97316', desc: 'Renouvellement / duplicata',  delai: '7-10 jours', prix: '15 000 FCFA' },
  { id: 'residence', label: 'Certificat Résidence', icon: 'home',  color: '#3b82f6', desc: 'Attestation officielle',      delai: '1-2 jours',  prix: '1 000 FCFA' },
  { id: 'diploma',   label: 'Copie de Diplôme',     icon: 'cap',   color: '#10b981', desc: 'Copie certifiée conforme',    delai: '5-7 jours',  prix: '3 000 FCFA' },
  { id: 'marriage',  label: 'Acte de Mariage',      icon: 'heart', color: '#ef4444', desc: 'Copie intégrale',             delai: '3-5 jours',  prix: '2 500 FCFA' },
];
