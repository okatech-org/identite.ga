import * as React from "react"

/**
 * iDocument — layout simple, sans coffre-fort. Le code E2E
 * (VaultProvider / VaultGate) reste disponible pour réactivation
 * future mais n'est plus monté.
 */
export default function IdocLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
