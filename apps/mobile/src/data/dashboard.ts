import type { IconName } from '@/design/icons';
import { idnTokens } from '@/design/tokens';

export type HomeModule = {
  id: 'icarte' | 'iboite' | 'idoc' | 'icv';
  label: string;
  sub: string;
  color: string;
  bgLight: string;
  bgDark: string;
  icon: IconName;
  route: string;
};

// Modules : alignés sur le web (apps/web/app/(citizen)/_content/fr.ts).
// Notifications n'est plus listé ici — il est accessible via l'icône
// cloche du header.
export const HOME_MODULES: HomeModule[] = [
  { id: 'icarte', label: 'iCarte',    sub: 'Cartes & wallet',     color: idnTokens.green, bgLight: idnTokens.greenSoft, bgDark: '#0F2A18', icon: 'wallet', route: '/icarte' },
  { id: 'iboite', label: 'iBoîte',    sub: 'Courriers · emails',  color: '#3b82f6',       bgLight: idnTokens.blueSoft,  bgDark: '#10243A', icon: 'mail2',  route: '/iboite' },
  { id: 'idoc',   label: 'iDocument', sub: 'Documents archivés',  color: '#a855f7',       bgLight: '#F3E8FF',           bgDark: '#2A1542', icon: 'file',   route: '/idoc' },
  { id: 'icv',    label: 'iCV',       sub: 'Mon CV en ligne',     color: '#EC4899',       bgLight: '#FCE7F3',           bgDark: '#2A1426', icon: 'file',   route: '/icv' },
];
