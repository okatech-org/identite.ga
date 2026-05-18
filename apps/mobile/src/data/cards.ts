import type { IconName } from '@/design/icons';

// Gradients par type de carte — verbatim mockups
export const CARD_GRADIENTS = {
  green:  ['#16a34a', '#15803d', '#065f46'] as const,
  orange: ['#f97316', '#ea580c', '#dc2626'] as const,
  blue:   ['#3b82f6', '#2563eb', '#4338ca'] as const,
  rose:   ['#f43f5e', '#e11d48', '#db2777'] as const,
  black:  ['#1e293b', '#0f172a', '#000000'] as const,
  purple: ['#9333ea', '#7e22ce', '#5b21b6'] as const,
  amber:  ['#f59e0b', '#d97706', '#a16207'] as const,
  yellow: ['#f59e0b', '#d97706', '#ca8a04'] as const,
  indigo: ['#4f46e5', '#4338ca', '#1e40af'] as const,
};

export type GradKey = keyof typeof CARD_GRADIENTS;

export type Card = {
  id: string;
  type: string;
  name: string;
  sub: string;
  grad: GradKey | 'white';
  icon: IconName;
  featured?: boolean;
  official?: boolean;
};

// Catalogue verbatim du cahier des charges
export const DEFAULT_CARDS: Card[] = [
  { id: 'cni',       type: 'cni',       name: "Carte d'Identité", sub: 'République Gabonaise',  grad: 'green',  icon: 'seal',      featured: true },
  { id: 'driving',   type: 'driving',   name: 'Permis de Conduire', sub: 'Catégories B, C',      grad: 'orange', icon: 'car',       featured: true },
  { id: 'transport', type: 'transport', name: 'Carte Transport',    sub: 'STLG Libreville',      grad: 'blue',   icon: 'bus',       featured: true },
  { id: 'health',    type: 'health',    name: 'CNAMGS',             sub: 'Assurance Maladie',    grad: 'white',  icon: 'heart',     featured: true, official: true },
  { id: 'bank',      type: 'bank',      name: 'BGFI Bank',          sub: 'Visa Premium',         grad: 'black',  icon: 'cc',        featured: true },
  { id: 'business',  type: 'business',  name: 'Carte de Visite',    sub: 'TechGabon SARL',       grad: 'purple', icon: 'briefcase', featured: true },
  { id: 'consular',  type: 'consular',  name: 'Carte Consulaire',   sub: 'République Gabonaise', grad: 'amber',  icon: 'globe' },
  { id: 'voter',     type: 'voter',     name: "Carte d'Électeur",   sub: 'Bureau 12 Libreville', grad: 'yellow', icon: 'vote' },
  { id: 'loyalty',   type: 'loyalty',   name: 'Carte Fidélité',     sub: 'Casino · 1500 pts',    grad: 'indigo', icon: 'gift' },
];

export type CardTemplate = { id: string; label: string; icon: IconName; grad: GradKey };

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'cni',       label: 'CNI',       icon: 'seal',      grad: 'green' },
  { id: 'driving',   label: 'Permis',    icon: 'car',       grad: 'orange' },
  { id: 'transport', label: 'Transport', icon: 'bus',       grad: 'blue' },
  { id: 'health',    label: 'Santé',     icon: 'heart',     grad: 'rose' },
  { id: 'bank',      label: 'Bancaire',  icon: 'cc',        grad: 'black' },
  { id: 'business',  label: 'Visite',    icon: 'briefcase', grad: 'purple' },
];

export const CUSTOM_COLORS: { id: GradKey; label: string }[] = [
  { id: 'green',  label: 'Vert' },
  { id: 'orange', label: 'Orange' },
  { id: 'blue',   label: 'Bleu' },
  { id: 'rose',   label: 'Rose' },
  { id: 'black',  label: 'Noir' },
  { id: 'purple', label: 'Violet' },
];

export const CUSTOM_ICONS: { id: IconName; label: string }[] = [
  { id: 'cc',        label: 'Carte' },
  { id: 'car',       label: 'Voiture' },
  { id: 'bus',       label: 'Bus' },
  { id: 'heart',     label: 'Cœur' },
  { id: 'briefcase', label: 'Valise' },
  { id: 'users',     label: 'Groupe' },
];
