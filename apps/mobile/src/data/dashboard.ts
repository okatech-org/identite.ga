import type { IconName } from '@/design/icons';
import { idnTokens } from '@/design/tokens';

export type HomeModule = {
  id: 'icarte' | 'iboite' | 'idoc' | 'icv' | 'notif';
  label: string;
  sub: string;
  badge?: string;
  color: string;
  bgLight: string;
  bgDark: string;
  icon: IconName;
  route: string;
};

export const HOME_MODULES: HomeModule[] = [
  { id: 'icarte', label: 'iCarte',       sub: '6 cartes',           color: idnTokens.green, bgLight: idnTokens.greenSoft, bgDark: '#0F2A18', icon: 'wallet', route: '/icarte' },
  { id: 'iboite', label: 'iBoîte',       sub: 'Courriers · emails', badge: '2 nouveaux', color: '#3b82f6', bgLight: idnTokens.blueSoft,   bgDark: '#10243A', icon: 'mail2',  route: '/iboite' },
  { id: 'idoc',   label: 'iDocument',    sub: '17 documents',                              color: '#a855f7', bgLight: '#F3E8FF',           bgDark: '#2A1542', icon: 'file',   route: '/idoc' },
  { id: 'icv',    label: 'iCV',          sub: 'Mon CV en ligne',                            color: '#EC4899', bgLight: '#FCE7F3',           bgDark: '#2A1426', icon: 'file',   route: '/icv' },
  { id: 'notif',  label: 'Notifications',sub: 'Centre alertes',     badge: '3 non lues',   color: '#dc2626', bgLight: '#FEE2E2',           bgDark: '#2A1414', icon: 'bell',   route: '/notifications' },
];

export type HomeTodo = {
  kind: 'mail' | 'demar';
  label: string;
  sub: string;
  tagLabel: string;
  tagColor: string;
  pct?: number;
  icon: IconName;
};

export const HOME_TODOS: HomeTodo[] = [
  { kind: 'mail',  label: 'Mairie de Libreville',     sub: 'Complément de dossier · 15 j', tagLabel: 'Urgent', tagColor: '#B83A3A',     icon: 'mail2' },
  { kind: 'demar', label: 'e-Visa Tourisme',          sub: 'Documents à fournir',          tagLabel: '60 %',   tagColor: idnTokens.blue,   pct: 60, icon: 'doc' },
  { kind: 'demar', label: 'Renouvellement passeport', sub: 'Affaires étrangères',          tagLabel: '30 %',   tagColor: idnTokens.yellow, pct: 30, icon: 'doc' },
];

export type HomeActivity = {
  t: string;
  e: string;
  a: string;
  icon: IconName;
  col: string;
  warn?: boolean;
};

export const HOME_ACTIVITY: HomeActivity[] = [
  { t: "Aujourd'hui 14:32", e: 'Authentification', a: 'sur Bourses Étudiantes',        icon: 'login',  col: idnTokens.green },
  { t: "Aujourd'hui 09:14", e: 'Vérification KYC', a: 'validée — Niveau 3',            icon: 'shield', col: idnTokens.green },
  { t: 'Hier 18:42',        e: 'Connexion',        a: 'Firefox Linux · Paris',          icon: 'shield', col: idnTokens.yellow, warn: true },
];

export type HomeReco = { l: string; sub: string; col: string; tag?: string };

export const HOME_RECOS: HomeReco[] = [
  { l: 'Acte de naissance',  sub: 'État civil',          col: '#E8DCC4', tag: 'Populaire' },
  { l: 'Quitus fiscal',      sub: 'DGI · sans rdv',      col: '#C4DCE8' },
  { l: 'Santé.ga',           sub: 'e-santé · CNAMGS',    col: '#C4E8D2', tag: 'New' },
  { l: 'Bourses étudiantes', sub: 'Enseign. supérieur',  col: '#E8C4DC' },
];
