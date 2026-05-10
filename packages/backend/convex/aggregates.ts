import { TableAggregate } from "@convex-dev/aggregate"

import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"

/**
 * Aggregates IDN — KPIs dashboard admin, comptés en O(log N).
 *
 * Synchronisation : à chaque insert/update/delete sur la table sous-jacente,
 * on appelle .insert() / .delete() / .replace() sur l'agrégat correspondant.
 * Pattern triggers convex-helpers (à câbler dans les mutations métier).
 *
 * Cf. §5.6 stack-technique.md.
 */

// Répartition des comptes IDN par niveau de garantie (1, 2, 3).
export const usersByLoa = new TableAggregate<{
  Key: number
  DataModel: DataModel
  TableName: "userProfile"
}>(components.usersByLoa, {
  sortKey: (doc) => doc.loa,
})

// Répartition par type de profil (citoyen / résident / visiteur / dev).
export const usersByProfile = new TableAggregate<{
  Key: string
  DataModel: DataModel
  TableName: "userProfile"
}>(components.usersByProfile, {
  sortKey: (doc) => doc.profileType,
})

// File KYC par statut (pending / submitted / under_review / approved / rejected).
export const kycByStatus = new TableAggregate<{
  Key: string
  DataModel: DataModel
  TableName: "kycRequest"
}>(components.kycByStatus, {
  sortKey: (doc) => doc.status,
})

// Volume d'événements audit par catégorie (action prefix).
export const auditByCategory = new TableAggregate<{
  Key: string
  DataModel: DataModel
  TableName: "auditLog"
}>(components.auditByCategory, {
  sortKey: (doc) => doc.action,
})
