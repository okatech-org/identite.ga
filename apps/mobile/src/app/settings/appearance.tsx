import React from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useMutation } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { Icon } from "@/design/icons"
import {
  useIdnTheme,
  useThemePreference,
  type ThemePreference,
} from "@/design/theme"
import { idnTokens } from "@/design/tokens"
import { api } from "@/lib/api"

const OPTIONS: { id: ThemePreference; label: string; sub: string }[] = [
  {
    id: "auto",
    label: "Système",
    sub: "Suit automatiquement le réglage de l’appareil",
  },
  { id: "light", label: "Clair", sub: "Fond clair en permanence" },
  { id: "dark", label: "Sombre", sub: "Fond sombre en permanence" },
]

export default function Appearance() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { preference, setPreference } = useThemePreference()
  const update = useMutation(api.preferences.updateMyPreferences)
  const [updating, setUpdating] = React.useState<ThemePreference | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function choose(next: ThemePreference) {
    if (next === preference) return
    const previous = preference
    setUpdating(next)
    setError(null)
    await setPreference(next)
    try {
      await update({ theme: next })
    } catch (caught) {
      await setPreference(previous)
      setError(
        caught instanceof Error ? caught.message : "Mise à jour impossible.",
      )
    } finally {
      setUpdating(null)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Apparence"
        sub="Choisissez le thème utilisé sur cet appareil."
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }}
      >
        <View
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {OPTIONS.map((option, index) => {
            const selected = option.id === preference
            return (
              <Pressable
                key={option.id}
                onPress={() => void choose(option.id)}
                disabled={updating !== null}
                style={{
                  padding: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderBottomWidth: index === OPTIONS.length - 1 ? 0 : 1,
                  borderBottomColor: t.borderSoft,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: t.ink, fontSize: 14, fontWeight: "600" }}
                  >
                    {option.label}
                  </Text>
                  <Text style={{ color: t.muted, fontSize: 11, marginTop: 3 }}>
                    {option.sub}
                  </Text>
                </View>
                {updating === option.id ? (
                  <Text style={{ color: t.muted }}>…</Text>
                ) : selected ? (
                  <Icon name="check" size={20} color={idnTokens.green} />
                ) : (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: t.border,
                    }}
                  />
                )}
              </Pressable>
            )
          })}
        </View>
        {error ? (
          <View
            style={{
              marginTop: 12,
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
