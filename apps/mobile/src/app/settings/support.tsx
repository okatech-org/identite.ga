import React from "react"
import { Linking, ScrollView, View } from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { SetMobileRow } from "@/components/rows/setting-row"
import { useIdnTheme } from "@/design/theme"

export default function Support() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Aide et support"
        sub="Une difficulté avec votre identité numérique ?"
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: 24,
          gap: 12,
        }}
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
          <SetMobileRow
            t={t}
            label="Appeler le centre d’aide"
            value="1407 · gratuit · 24 h/24"
            onPress={() => void Linking.openURL("tel:1407")}
          />
          <SetMobileRow
            t={t}
            label="Écrire au support"
            value="support@identite.ga"
            onPress={() => void Linking.openURL("mailto:support@identite.ga")}
          />
          <SetMobileRow
            t={t}
            label="Consulter le centre d’aide"
            value="Guides et questions fréquentes"
            onPress={() => void Linking.openURL("https://identite.ga/aide")}
          />
        </View>
      </ScrollView>
    </View>
  )
}
