import React from "react"
import { ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { Toggle } from "@/design/components/toggle"
import { useIdnTheme } from "@/design/theme"
import { api } from "@/lib/api"

type Category = "security" | "kyc" | "consent" | "comms"
type Channel = "email" | "inApp"
type Matrix = Record<Category, boolean>
type Preferences = Record<Channel, Matrix>

const FALLBACK: Preferences = {
  email: { security: true, kyc: true, consent: true, comms: false },
  inApp: { security: true, kyc: true, consent: true, comms: true },
}

const CATEGORIES: { id: Category; label: string; help: string }[] = [
  {
    id: "security",
    label: "Sécurité",
    help: "Connexions, code PIN et alertes sensibles",
  },
  {
    id: "kyc",
    label: "Vérification d’identité",
    help: "Avancement et décisions de vérification",
  },
  {
    id: "consent",
    label: "Consentements",
    help: "Nouveaux accès et révocations",
  },
  {
    id: "comms",
    label: "Informations IDN",
    help: "Actualités et communications de service",
  },
]

export default function NotificationPreferences() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useConvexAuth()
  const remote = useQuery(
    api.preferences.getMyNotificationPreferences,
    isAuthenticated ? {} : "skip",
  )
  const update = useMutation(api.preferences.updateMyNotificationPreferences)
  const [local, setLocal] = React.useState<Preferences | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (remote !== undefined)
      setLocal(
        remote
          ? { email: { ...remote.email }, inApp: { ...remote.inApp } }
          : FALLBACK,
      )
  }, [remote])

  async function toggle(channel: Channel, category: Category, value: boolean) {
    if (!local) return
    const previous = local
    const next = {
      ...local,
      [channel]: { ...local[channel], [category]: value },
    }
    setLocal(next)
    setError(null)
    try {
      await update({ [channel]: next[channel] })
    } catch (caught) {
      setLocal(previous)
      setError(
        caught instanceof Error ? caught.message : "Mise à jour impossible.",
      )
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Préférences de notification"
        sub="Choisissez les catégories reçues par email et dans l’application."
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: 24,
          gap: 12,
        }}
      >
        {CATEGORIES.map((category) => (
          <View
            key={category.id}
            style={{
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 14,
              padding: 15,
              gap: 13,
            }}
          >
            <View>
              <Text style={{ color: t.ink, fontSize: 14, fontWeight: "600" }}>
                {category.label}
              </Text>
              <Text style={{ color: t.muted, fontSize: 11, marginTop: 3 }}>
                {category.help}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: t.ink2, fontSize: 12 }}>Email</Text>
              <Toggle
                t={t}
                on={local?.email[category.id] ?? false}
                onChange={(value) => void toggle("email", category.id, value)}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: t.ink2, fontSize: 12 }}>
                Dans l’application
              </Text>
              <Toggle
                t={t}
                on={local?.inApp[category.id] ?? false}
                onChange={(value) => void toggle("inApp", category.id, value)}
              />
            </View>
          </View>
        ))}
        {error ? (
          <View
            style={{
              backgroundColor: t.dark ? "#3A1212" : "#FBE5E5",
              padding: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#B83A3A", fontSize: 12 }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
