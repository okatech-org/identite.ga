/**
 * Catalogue des documents officiels demandables à l'administration.
 * Cf. SPECS_FEATURES_CITIZEN.md §3.9 — libellés, descriptions, délais et
 * frais verbatim de la spec.
 */

import {
  Baby,
  Car,
  GraduationCap,
  Heart,
  Home,
  Scale,
  type LucideIcon,
} from "lucide-react"

export type RequestableDocId =
  | "birth-certificate"
  | "criminal-record"
  | "driving-license"
  | "residence-cert"
  | "diploma-copy"
  | "marriage-cert"

export type RequestableDoc = {
  id: RequestableDocId
  label: string
  description: string
  icon: LucideIcon
  /** Couleur d'accent (hex). */
  color: string
  delay: string
  price: string
}

export const REQUESTABLE_DOCS: readonly RequestableDoc[] = [
  {
    id: "birth-certificate",
    label: "Acte de Naissance",
    description: "Copie intégrale ou extrait d'acte de naissance",
    icon: Baby,
    color: "#ec4899",
    delay: "3-5 jours",
    price: "2 500 FCFA",
  },
  {
    id: "criminal-record",
    label: "Casier Judiciaire",
    description: "Bulletin n°3 du casier judiciaire",
    icon: Scale,
    color: "#a855f7",
    delay: "5-7 jours",
    price: "5 000 FCFA",
  },
  {
    id: "driving-license",
    label: "Permis de Conduire",
    description: "Renouvellement ou duplicata du permis",
    icon: Car,
    color: "#f97316",
    delay: "7-10 jours",
    price: "15 000 FCFA",
  },
  {
    id: "residence-cert",
    label: "Certificat de Résidence",
    description: "Attestation de domicile officielle",
    icon: Home,
    color: "#3b82f6",
    delay: "1-2 jours",
    price: "1 000 FCFA",
  },
  {
    id: "diploma-copy",
    label: "Copie de Diplôme",
    description: "Copie certifiée conforme de diplôme",
    icon: GraduationCap,
    color: "#10b981",
    delay: "5-7 jours",
    price: "3 000 FCFA",
  },
  {
    id: "marriage-cert",
    label: "Acte de Mariage",
    description: "Copie intégrale d'acte de mariage",
    icon: Heart,
    color: "#ef4444",
    delay: "3-5 jours",
    price: "2 500 FCFA",
  },
] as const

/** Statuts d'une demande en cours (cf. §3.9). */
export type RequestStatus = "pending" | "processing" | "ready"

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "En attente",
  processing: "En cours",
  ready: "Prêt",
}

export const REQUEST_STATUS_CLASS: Record<RequestStatus, string> = {
  pending:
    "text-amber-600 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-500/15",
  processing:
    "text-blue-600 bg-blue-500/10 dark:text-blue-300 dark:bg-blue-500/15",
  ready:
    "text-green-600 bg-green-500/10 dark:text-green-300 dark:bg-green-500/15",
}
