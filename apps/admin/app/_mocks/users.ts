/**
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx:1096
 * Verbatim.
 */

import type { LoALevel } from "@repo/ui/components/loa-badge"

export type AdminUser = {
  name: string
  email: string
  loa: LoALevel
  profil: "Citoyen" | "Résident" | "Visiteur"
  joined: string
}

export const ADMIN_USERS: AdminUser[] = [
  { name: "Aïssatou Mboumba",   email: "aissatou.m@example.ga",     loa: 3, profil: "Citoyen",  joined: "14 jan 2026" },
  { name: "Marc Lefèvre",       email: "marc.lefevre@example.fr",   loa: 2, profil: "Résident", joined: "02 fév 2026" },
  { name: "Yuki Tanaka",        email: "y.tanaka@example.jp",       loa: 1, profil: "Visiteur", joined: "21 avr 2026" },
  { name: "Jean-Baptiste Ondo", email: "jb.ondo@example.ga",        loa: 3, profil: "Citoyen",  joined: "08 mar 2026" },
  { name: "Sarah Cohen",        email: "sarah.c@example.com",       loa: 2, profil: "Résident", joined: "15 mar 2026" },
  { name: "Patrick Mengue",     email: "p.mengue@example.ga",       loa: 3, profil: "Citoyen",  joined: "01 jan 2026" },
]
