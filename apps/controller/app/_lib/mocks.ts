/**
 * Données mockées — extraites littéralement de
 * `ressources/interfaces/project/idn-desktop.jsx` (lignes 1860-2462).
 *
 * Aucune source dynamique pour cette première itération : les pages sont
 * statiques pour valider visuellement la conformité aux maquettes avant
 * câblage Convex (PR ultérieure).
 */

export type LoALevel = 1 | 2 | 3
export type Priority = "haute" | "normale"

export type QueueItem = {
  ref: string
  name: string
  target: LoALevel
  doc: string
  age: string
  priority: Priority
}

export const queueItems: QueueItem[] = [
  {
    ref: "KYC-7K9-3F2",
    name: "Aïssatou Mboumba",
    target: 2,
    doc: "CNI gabonaise",
    age: "12 min",
    priority: "haute",
  },
  {
    ref: "KYC-7K9-3F1",
    name: "Marc Lefèvre",
    target: 2,
    doc: "Carte de séjour",
    age: "34 min",
    priority: "normale",
  },
  {
    ref: "KYC-7K9-3E8",
    name: "Yuki Tanaka",
    target: 1,
    doc: "Passeport JP",
    age: "1h 12min",
    priority: "normale",
  },
  {
    ref: "KYC-7K9-3E5",
    name: "Patrick Mengue",
    target: 3,
    doc: "CNI + acte de naissance",
    age: "2h 04min",
    priority: "haute",
  },
  {
    ref: "KYC-7K9-3E2",
    name: "Sarah Cohen",
    target: 2,
    doc: "Carte de séjour",
    age: "3h 18min",
    priority: "normale",
  },
]

export type HistoryEntry = {
  ts: string
  name: string
  loc: string
  result: "valide" | "expiré"
}

export const historyEntries: HistoryEntry[] = [
  {
    ts: "10 mai · 14:32",
    name: "Aïssatou Mboumba",
    loc: "Aéroport L.B.M.",
    result: "valide",
  },
  {
    ts: "10 mai · 12:18",
    name: "Marc Lefèvre",
    loc: "Préfecture Libreville",
    result: "valide",
  },
  {
    ts: "10 mai · 10:04",
    name: "Yuki Tanaka",
    loc: "Aéroport L.B.M.",
    result: "valide",
  },
  {
    ts: "09 mai · 16:42",
    name: "Patrick Mengue",
    loc: "Poste frontière Bitam",
    result: "expiré",
  },
  {
    ts: "09 mai · 14:11",
    name: "Sarah Cohen",
    loc: "Préfecture Libreville",
    result: "valide",
  },
]

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
