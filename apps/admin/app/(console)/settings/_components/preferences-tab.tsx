"use client"

import { useMutation, useQuery } from "convex/react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

import { fr } from "../../../_content/fr"
import {
  SettingsRow,
  SettingsSection,
} from "../../../_components/settings-section"

export function PreferencesTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prefs = useQuery(api.preferences.getMyPreferences) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = useMutation(api.preferences.updateMyPreferences) as any
  const { theme, setTheme } = useTheme()

  const onLanguageChange = async (lang: "fr" | "en") => {
    try {
      await update({ language: lang })
      toast.success(fr.settings.preferences.saveSuccessToast)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
  }

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
    return <div className="h-32 animate-pulse rounded-xl bg-secondary" />
  }

  const currentLang = (prefs?.language ?? "fr") as "fr" | "en"
  const currentTheme =
    theme === "system"
      ? "auto"
      : ((theme ?? prefs?.theme ?? "auto") as "light" | "dark" | "auto")

  return (
    <SettingsSection
      title={fr.settings.preferences.title}
      sub={fr.settings.preferences.sub}
    >
      <SettingsRow
        label={fr.settings.preferences.language.label}
        description={fr.settings.preferences.language.description}
        trailing={
          <Select
            value={currentLang}
            onValueChange={(v) => void onLanguageChange(v as "fr" | "en")}
          >
            <SelectTrigger className="!h-10 w-40 !text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fr.settings.preferences.language.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <SettingsRow
        label={fr.settings.preferences.theme.label}
        description={fr.settings.preferences.theme.description}
        trailing={
          <Select
            value={currentTheme}
            onValueChange={(v) =>
              void onThemeChange(v as "light" | "dark" | "auto")
            }
          >
            <SelectTrigger className="!h-10 w-40 !text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fr.settings.preferences.theme.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </SettingsSection>
  )
}
