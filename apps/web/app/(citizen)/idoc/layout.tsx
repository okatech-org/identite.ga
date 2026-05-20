import * as React from "react"

import { VaultProvider } from "./_hooks/use-vault"
import { VaultGate } from "./_components/vault-gate"

export default function IdocLayout({ children }: { children: React.ReactNode }) {
  return (
    <VaultProvider>
      <VaultGate>{children}</VaultGate>
    </VaultProvider>
  )
}
