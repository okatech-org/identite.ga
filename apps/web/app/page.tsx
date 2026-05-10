import { Button } from "@repo/ui/components/button"

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Hello shadcn/ui</h1>
      <Button>Click me</Button>
    </main>
  )
}
