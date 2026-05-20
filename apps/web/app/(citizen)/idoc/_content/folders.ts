/**
 * Catalogue des dossiers iDocument.
 * Cf. SPECS_FEATURES_CITIZEN.md §3.3 — labels, descriptions, gradients
 * verbatim de la spec design. Les `id` correspondent à `VAULT_FOLDERS`
 * du schema Convex.
 */

import {
  Baby,
  Briefcase,
  Car,
  FileText,
  GraduationCap,
  Heart,
  Home,
  User,
  type LucideIcon,
} from "lucide-react"

export type VaultFolderId =
  | "identity"
  | "civil_status"
  | "residence"
  | "education"
  | "work"
  | "health"
  | "vehicle"
  | "other"

export type FolderConfig = {
  id: VaultFolderId
  label: string
  description: string
  icon: LucideIcon
  /** Classes Tailwind `from-… to-…` pour la vignette dégradée. */
  gradient: string
  /** Couleur d'accent unique (hex) pour les pastilles d'icône. */
  accent: string
  /** Couleur de fond claire (Tailwind ou hex direct). */
  bgLight: string
  /** Couleur de fond sombre. */
  bgDark: string
}

export const FOLDERS: readonly FolderConfig[] = [
  {
    id: "identity",
    label: "Identité",
    description: "CNI, Passeport, Carte de séjour",
    icon: User,
    gradient: "from-blue-500 to-indigo-600",
    accent: "#3b82f6",
    bgLight: "#DBEAFE",
    bgDark: "#10243A",
  },
  {
    id: "civil_status",
    label: "État Civil",
    description: "Acte de naissance, mariage, divorce",
    icon: Baby,
    gradient: "from-pink-500 to-rose-600",
    accent: "#ec4899",
    bgLight: "#FCE7F3",
    bgDark: "#2A1426",
  },
  {
    id: "residence",
    label: "Domicile",
    description: "Justificatif de domicile, factures",
    icon: Home,
    gradient: "from-emerald-500 to-teal-600",
    accent: "#10b981",
    bgLight: "#D1FAE5",
    bgDark: "#0F2A18",
  },
  {
    id: "education",
    label: "Diplômes",
    description: "Diplômes, certificats, attestations",
    icon: GraduationCap,
    gradient: "from-amber-500 to-orange-600",
    accent: "#f59e0b",
    bgLight: "#FEF3C7",
    bgDark: "#2A1F0A",
  },
  {
    id: "work",
    label: "Travail",
    description: "Contrats, bulletins de paie",
    icon: Briefcase,
    gradient: "from-purple-500 to-violet-600",
    accent: "#a855f7",
    bgLight: "#F3E8FF",
    bgDark: "#2A1542",
  },
  {
    id: "health",
    label: "Santé",
    description: "Carte CNAMGS, ordonnances",
    icon: Heart,
    gradient: "from-red-500 to-rose-600",
    accent: "#ef4444",
    bgLight: "#FEE2E2",
    bgDark: "#2A1212",
  },
  {
    id: "vehicle",
    label: "Véhicule",
    description: "Permis de conduire, carte grise",
    icon: Car,
    gradient: "from-cyan-500 to-blue-600",
    accent: "#06b6d4",
    bgLight: "#CFFAFE",
    bgDark: "#0E2A30",
  },
  {
    id: "other",
    label: "Autres",
    description: "Documents divers",
    icon: FileText,
    gradient: "from-slate-500 to-gray-600",
    accent: "#64748b",
    bgLight: "#E2E8F0",
    bgDark: "#1F2937",
  },
] as const

const FOLDER_INDEX: Record<VaultFolderId, FolderConfig> = FOLDERS.reduce(
  (acc, f) => {
    acc[f.id] = f
    return acc
  },
  {} as Record<VaultFolderId, FolderConfig>,
)

export function getFolder(id: string): FolderConfig {
  return (FOLDER_INDEX as Record<string, FolderConfig | undefined>)[id] ?? FOLDERS[0]!
}

/** Catégories dont les documents n'expirent jamais (cf. §3.10). */
export const NEVER_EXPIRES: ReadonlySet<VaultFolderId> = new Set([
  "civil_status",
  "education",
])
