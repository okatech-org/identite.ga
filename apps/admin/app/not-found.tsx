import Link from "next/link"

import { Button } from "@repo/ui/components/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        Erreur 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        La page que vous cherchez n&apos;existe pas dans la console
        administrateur.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </main>
  )
}
