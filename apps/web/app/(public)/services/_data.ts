import type { LoALevel } from "@repo/ui/components/loa-badge"

export type ServiceCategory = {
  category: string
  items: { name: string; loa: LoALevel }[]
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: "Affaires consulaires",
    items: [
      { name: "e-Visa", loa: 1 },
      { name: "Carte de séjour", loa: 2 },
      { name: "Passeport diplomatique", loa: 3 },
      { name: "Légalisation de documents", loa: 2 },
    ],
  },
  {
    category: "État civil",
    items: [
      { name: "Acte de naissance", loa: 2 },
      { name: "Acte de mariage", loa: 2 },
      { name: "Certificat de nationalité", loa: 3 },
      { name: "Livret de famille", loa: 2 },
    ],
  },
  {
    category: "Fiscalité",
    items: [
      { name: "Impots.ga — déclarations", loa: 2 },
      { name: "Quitus fiscal", loa: 2 },
      { name: "Numéro d'identification fiscale", loa: 1 },
    ],
  },
  {
    category: "Éducation",
    items: [
      { name: "Bourses étudiantes", loa: 2 },
      { name: "Inscription universitaire", loa: 1 },
      { name: "Reconnaissance de diplôme", loa: 2 },
    ],
  },
  {
    category: "Santé",
    items: [
      { name: "Santé.ga — portail e-santé", loa: 2 },
      { name: "Carnet de vaccination", loa: 1 },
      { name: "Carte CNAMGS", loa: 3 },
    ],
  },
  {
    category: "Justice",
    items: [
      { name: "Casier judiciaire (B3)", loa: 3 },
      { name: "Aide juridictionnelle", loa: 2 },
    ],
  },
]
