export type DeveloperApplication = {
  id: string
  clientId: string
  name: string
  env: "production" | "sandbox"
  loa: 1 | 2 | 3
  scopes: string[]
  services: unknown[]
  disabled: boolean
  linkedClientId: string | null
  productionStatus: "none" | "pending" | "approved" | "rejected"
}

export type ApplicationGroup = {
  id: string
  name: string
  sandbox: DeveloperApplication | null
  production: DeveloperApplication | null
}

/** Regroupe les deux enregistrements OAuth d'une même application. */
export function groupApplications(
  applications: readonly DeveloperApplication[],
): ApplicationGroup[] {
  const groups = new Map<string, ApplicationGroup>()

  for (const application of applications) {
    const groupId =
      application.env === "sandbox"
        ? application.clientId
        : (application.linkedClientId ?? application.clientId)
    const existing = groups.get(groupId) ?? {
      id: groupId,
      name: application.name,
      sandbox: null,
      production: null,
    }

    if (application.env === "sandbox") {
      existing.sandbox = application
      existing.name = application.name
    } else {
      existing.production = application
    }
    groups.set(groupId, existing)
  }

  return [...groups.values()]
}
