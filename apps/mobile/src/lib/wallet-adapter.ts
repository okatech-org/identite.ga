import type { Doc } from '@repo/backend/convex/_generated/dataModel';
import type { IconName } from '@/design/icons';
import type { Card, GradKey } from '@/data/cards';

/**
 * Adaptateur entre le format Convex (`walletCard`) et le format UI (`Card`).
 *
 * Le backend stocke le gradient au format Tailwind ("from-green-600 ...")
 * pour pouvoir être consommé directement sur le web. En RN on l'extrait
 * vers une clé GradKey pour adresser `CARD_GRADIENTS`.
 */

type WalletCard = Doc<'walletCard'>;

const VALID_ICONS: ReadonlySet<IconName> = new Set<IconName>([
  'user', 'userPlus', 'login', 'mail', 'lock', 'shield', 'check', 'arrow',
  'arrowL', 'doc', 'camera', 'qr', 'bell', 'link', 'search', 'plus', 'more',
  'copy', 'eye', 'home', 'grid', 'activity', 'torch', 'gridSm', 'flip',
  'face', 'pin', 'wallet', 'cc', 'car', 'bus', 'heart', 'briefcase', 'globe',
  'vote', 'gift', 'users', 'flag', 'palette', 'edit', 'trash', 'grip',
  'eyeOff', 'rotate', 'share', 'download', 'mail2', 'package', 'chat',
  'baby', 'cap', 'file', 'folderO', 'upload', 'sparkles', 'scale', 'checkCir',
  'seal',
]);

export function gradientToGradKey(gradient: string): GradKey | 'white' {
  const g = gradient.toLowerCase();
  if (g.includes('slate') || g.includes('zinc') || g.includes('black')) return 'black';
  if (g.includes('emerald') || g.includes('green')) return 'green';
  if (g.includes('red') && !g.includes('rose')) return 'orange';
  if (g.includes('orange')) return 'orange';
  if (g.includes('pink') || g.includes('rose')) return 'rose';
  if (g.includes('purple') || g.includes('violet')) return 'purple';
  if (g.includes('amber')) return 'amber';
  if (g.includes('yellow')) return 'yellow';
  if (g.includes('indigo')) return 'indigo';
  if (g.includes('blue')) return 'blue';
  if (g.includes('white')) return 'white';
  return 'green';
}

const GRAD_KEY_TO_TAILWIND: Record<GradKey, string> = {
  green:  'from-green-600 via-green-700 to-emerald-800',
  orange: 'from-orange-500 via-orange-600 to-red-600',
  blue:   'from-blue-500 via-blue-600 to-indigo-700',
  rose:   'from-rose-500 via-rose-600 to-pink-600',
  black:  'from-slate-800 via-slate-900 to-black',
  purple: 'from-purple-600 via-purple-700 to-violet-800',
  amber:  'from-amber-500 via-amber-600 to-yellow-700',
  yellow: 'from-amber-400 via-yellow-500 to-yellow-700',
  indigo: 'from-indigo-500 via-indigo-600 to-blue-700',
};

export function gradKeyToGradient(grad: GradKey): string {
  return GRAD_KEY_TO_TAILWIND[grad];
}

function safeIcon(iconKey: string): IconName {
  return VALID_ICONS.has(iconKey as IconName) ? (iconKey as IconName) : 'cc';
}

export function walletCardToUi(card: {
  _id: string;
  type: string;
  name: string;
  subtitle?: string;
  gradient: string;
  iconKey: string;
  isOfficialStyle: boolean;
  featured: boolean;
}): Card {
  return {
    id: card._id,
    type: card.type,
    name: card.name,
    sub: card.subtitle ?? '',
    grad: gradientToGradKey(card.gradient),
    icon: safeIcon(card.iconKey),
    featured: card.featured,
    official: card.isOfficialStyle,
  };
}

export type WalletCardId = WalletCard['_id'];
