/**
 * Catalogue iCarte — verbatim SPECS_FEATURES_CITIZEN.md §1.6, §1.7, §1.8.
 * Le backend stocke `gradient` en classes Tailwind (utilisables avec
 * `bg-gradient-to-br ${gradient}`) et `iconKey` en string.
 */

import {
  Briefcase,
  Bus,
  Car,
  CreditCard,
  Flag,
  Gift,
  Globe,
  Heart,
  Palette,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react"

export type CardIconKey =
  | "seal"
  | "cc"
  | "car"
  | "bus"
  | "heart"
  | "briefcase"
  | "globe"
  | "vote"
  | "gift"
  | "users"
  | "flag"
  | "palette"

/**
 * Mapping iconKey → composant lucide. `seal` est un SVG inline (sceau Gabon)
 * géré dans `card-art-icon.tsx`.
 */
export const CARD_LUCIDE_ICONS: Record<
  Exclude<CardIconKey, "seal">,
  LucideIcon
> = {
  cc: CreditCard,
  car: Car,
  bus: Bus,
  heart: Heart,
  briefcase: Briefcase,
  globe: Globe,
  vote: Vote,
  gift: Gift,
  users: Users,
  flag: Flag,
  palette: Palette,
}

/**
 * Gradients par clé courte — verbatim spec §1.6.
 * Identiques aux classes Tailwind stockées par le backend.
 */
export const CARD_GRADIENTS = {
  green: "from-green-600 via-green-700 to-emerald-800",
  orange: "from-orange-500 via-orange-600 to-red-600",
  blue: "from-blue-500 via-blue-600 to-indigo-700",
  rose: "from-rose-500 via-rose-600 to-pink-600",
  black: "from-slate-800 via-slate-900 to-black",
  purple: "from-purple-600 via-purple-700 to-violet-800",
  amber: "from-amber-500 via-amber-600 to-yellow-700",
  yellow: "from-amber-400 via-yellow-500 to-yellow-700",
  indigo: "from-indigo-500 via-indigo-600 to-blue-700",
} as const

export type GradKey = keyof typeof CARD_GRADIENTS

// ─────────────────────────────────────────────────────────────────────────
// Templates d'ajout (verbatim §1.5.2 + §1.6)
// ─────────────────────────────────────────────────────────────────────────

export type WalletCardType =
  | "cni"
  | "driving"
  | "transport"
  | "health"
  | "bank"
  | "business"
  | "consular"
  | "voter"
  | "loyalty"
  | "custom"

export type FieldSpec = {
  key: string
  label: string
  placeholder?: string
}

export type CardTemplate = {
  id: Exclude<WalletCardType, "consular" | "voter" | "loyalty" | "custom">
  label: string
  iconKey: CardIconKey
  grad: GradKey
  defaultName: string
  defaultSubtitle: string
  isOfficialStyle: boolean
  data: FieldSpec[]
  backData: FieldSpec[]
}

/**
 * Templates visibles dans le bloc « Ajouter une carte » — spec §1.5.2.
 * Les champs respectent §1.7 (label, placeholder).
 */
export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "cni",
    label: "CNI",
    iconKey: "seal",
    grad: "green",
    defaultName: "Carte d'Identité",
    defaultSubtitle: "République Gabonaise",
    isOfficialStyle: false,
    data: [
      { key: "nom", label: "Nom complet", placeholder: "DUPONT Jean" },
      { key: "numero", label: "Numéro CNI", placeholder: "GA-1234-5678-9012" },
      { key: "validite", label: "Validité", placeholder: "MM/AAAA" },
    ],
    backData: [
      { key: "naissance", label: "Date de naissance", placeholder: "JJ/MM/AAAA" },
      { key: "lieu", label: "Lieu de naissance", placeholder: "Libreville" },
    ],
  },
  {
    id: "driving",
    label: "Permis",
    iconKey: "car",
    grad: "orange",
    defaultName: "Permis de Conduire",
    defaultSubtitle: "Catégories",
    isOfficialStyle: false,
    data: [
      { key: "nom", label: "Nom complet", placeholder: "DUPONT Jean" },
      { key: "numero", label: "Numéro de permis" },
      { key: "categories", label: "Catégories", placeholder: "A, B, C" },
    ],
    backData: [
      { key: "delivrance", label: "Date de délivrance" },
      { key: "prefecture", label: "Préfecture" },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    iconKey: "bus",
    grad: "blue",
    defaultName: "Carte Transport",
    defaultSubtitle: "STLG Libreville",
    isOfficialStyle: false,
    data: [
      { key: "numero", label: "Numéro", placeholder: "TRS-2024-001234" },
      { key: "zone", label: "Zone", placeholder: "Toutes zones" },
      { key: "validite", label: "Validité", placeholder: "MM/AAAA" },
    ],
    backData: [
      { key: "type", label: "Type abonnement" },
      { key: "solde", label: "Solde" },
    ],
  },
  {
    id: "health",
    label: "Santé",
    iconKey: "heart",
    grad: "rose",
    defaultName: "CNAMGS",
    defaultSubtitle: "Assurance Maladie",
    isOfficialStyle: true,
    data: [
      { key: "regime", label: "Régime", placeholder: "Salarié / Étudiant" },
      { key: "numero", label: "Numéro CNAMGS", placeholder: "CNAM-789012" },
      { key: "validite", label: "Validité" },
    ],
    backData: [
      { key: "employeur", label: "Employeur" },
      { key: "couverture", label: "Couverture" },
    ],
  },
  {
    id: "bank",
    label: "Bancaire",
    iconKey: "cc",
    grad: "black",
    defaultName: "Carte Bancaire",
    defaultSubtitle: "",
    isOfficialStyle: false,
    data: [
      { key: "numero", label: "Numéro", placeholder: "**** **** **** 4521" },
      { key: "titulaire", label: "Titulaire", placeholder: "DUPONT JEAN" },
      { key: "expiration", label: "Expiration", placeholder: "MM/AA" },
    ],
    backData: [
      { key: "cvv", label: "CVV", placeholder: "***" },
      { key: "plafond", label: "Plafond" },
    ],
  },
  {
    id: "business",
    label: "Visite",
    iconKey: "briefcase",
    grad: "purple",
    defaultName: "Carte de Visite",
    defaultSubtitle: "",
    isOfficialStyle: false,
    data: [
      { key: "titre", label: "Poste", placeholder: "Directeur Technique" },
      { key: "entreprise", label: "Entreprise", placeholder: "TechGabon SARL" },
    ],
    backData: [
      { key: "email", label: "Email" },
      { key: "tel", label: "Téléphone" },
      { key: "site", label: "Site web" },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────
// Palette custom (§1.8)
// ─────────────────────────────────────────────────────────────────────────

export const CUSTOM_COLORS: { id: GradKey; label: string }[] = [
  { id: "green", label: "Vert" },
  { id: "orange", label: "Orange" },
  { id: "blue", label: "Bleu" },
  { id: "rose", label: "Rose" },
  { id: "black", label: "Noir" },
  { id: "purple", label: "Violet" },
]

export const CUSTOM_ICONS: { id: CardIconKey; label: string }[] = [
  { id: "cc", label: "Carte" },
  { id: "car", label: "Voiture" },
  { id: "bus", label: "Bus" },
  { id: "heart", label: "Cœur" },
  { id: "briefcase", label: "Valise" },
  { id: "users", label: "Groupe" },
]

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Mapping Tailwind classes → clé courte. Le backend stocke en classes
 * Tailwind, mais on a besoin de la clé pour les pickers (custom modal,
 * preview live).
 */
export function gradientToKey(gradient: string): GradKey {
  const g = gradient.toLowerCase()
  if (g.includes("slate") || g.includes("zinc")) return "black"
  if (g.includes("emerald") || g.includes("green")) return "green"
  if (g.includes("orange") || (g.includes("red") && !g.includes("rose")))
    return "orange"
  if (g.includes("rose") || g.includes("pink")) return "rose"
  if (g.includes("purple") || g.includes("violet")) return "purple"
  if (g.includes("amber") && g.includes("yellow-7")) return "amber"
  if (g.includes("yellow")) return "yellow"
  if (g.includes("indigo") && g.includes("blue-7")) return "indigo"
  if (g.includes("blue")) return "blue"
  if (g.includes("amber")) return "amber"
  return "green"
}

export function keyToGradient(key: GradKey): string {
  return CARD_GRADIENTS[key]
}

/**
 * Capitalise la première lettre d'une clé pour affichage en label sur la
 * carte plein écran (recto/verso).
 */
export function formatDataLabel(key: string): string {
  if (!key) return ""
  return (
    key.charAt(0).toUpperCase() +
    key.slice(1).replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()
  )
}
