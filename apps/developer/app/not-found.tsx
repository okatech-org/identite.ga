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
        Cette page n&apos;existe pas dans le portail développeur.
      </p>
      <Button asChild className="mt-8">
        <Link href="/applications">Retour aux applications</Link>
      </Button>
    </main>
  )
}
