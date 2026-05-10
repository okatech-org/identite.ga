"use client"

import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@repo/ui/lib/utils"

const OPTIONS = [
  { value: "light", label: "Clair", Icon: SunIcon },
  { value: "system", label: "Système", Icon: MonitorIcon },
  { value: "dark", label: "Sombre", Icon: MoonIcon },
] as const

function ThemeToggle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l'interface"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5",
        className,
      )}
      {...props}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
              active && "bg-secondary text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

export { ThemeToggle }
