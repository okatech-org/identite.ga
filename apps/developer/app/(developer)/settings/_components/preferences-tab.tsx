"use client"

import { useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../../_content/fr"
import { SettingsSection } from "../../../_components/settings-section"

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Clair",
    description: "Fond clair en permanence",
    icon: SunIcon,
  },
  {
    value: "dark",
    label: "Sombre",
    description: "Fond sombre en permanence",
    icon: MoonIcon,
  },
  {
    value: "auto",
    label: "Automatique",
    description: "Suit le réglage de l’ordinateur",
    icon: MonitorIcon,
  },
] as const

export function PreferencesTab() {
  const prefs = useQuery(api.preferences.getMyPreferences)
  const update = useMutation(api.preferences.updateMyPreferences)
  const { theme, resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    if (!prefs?.theme) return
    setTheme(prefs.theme === "auto" ? "system" : prefs.theme)
  }, [prefs?.theme, setTheme])

  const onThemeChange = async (t: "light" | "dark" | "auto") => {
    setTheme(t === "auto" ? "system" : t)
    try {
      await update({ theme: t })
      toast.success(fr.settings.preferences.saveSuccessToast)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
  }

  if (prefs === undefined) {
    return <div className="h-32 animate-pulse rounded-xl bg-idn-surface-2" />
  }

  const currentTheme =
    theme === "system"
      ? "auto"
      : ((theme ?? prefs?.theme ?? "auto") as "light" | "dark" | "auto")

  return (
    <SettingsSection
      title={fr.settings.preferences.title}
      sub={fr.settings.preferences.sub}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = currentTheme === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => void onThemeChange(option.value)}
              className={`relative flex min-h-32 flex-col rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-idn-green ${
                selected
                  ? "border-idn-green bg-idn-green-soft/70 dark:bg-idn-green/10"
                  : "border-idn-border bg-idn-surface hover:bg-idn-surface-2"
              }`}
            >
              <span
                className={`flex size-9 items-center justify-center rounded-lg ${
                  selected
                    ? "bg-idn-green text-white"
                    : "bg-idn-surface-2 text-idn-muted"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className="mt-4 text-sm font-semibold text-idn-ink">
                {option.label}
              </span>
              <span className="mt-1 text-xs leading-5 text-idn-muted">
                {option.description}
              </span>
              {selected ? (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-idn-green text-white">
                  <CheckIcon className="size-3" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {currentTheme === "auto" ? (
        <p className="mt-4 text-xs text-idn-muted">
          Réglage système détecté :{" "}
          {resolvedTheme === "dark" ? "sombre" : "clair"}.
        </p>
      ) : null}
    </SettingsSection>
  )
}
