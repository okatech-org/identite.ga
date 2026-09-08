import React from "react"
import { Alert, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { IdnButton } from "@/design/components/idn-button"
import { useIdnTheme } from "@/design/theme"
import { idnTokens } from "@/design/tokens"
import { api } from "@/lib/api"

export default function Consents() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useConvexAuth()
  const list = useQuery(
    api.oauthConsents.listMine,
    isAuthenticated ? {} : "skip",
  )
  const revoke = useMutation(api.oauthConsents.revokeForClient)
  const [revoking, setRevoking] = React.useState<string | null>(null)

  function confirm(clientId: string, appName: string) {
    Alert.alert(
      `Retirer l’accès à ${appName} ?`,
      "L’application ne pourra plus accéder à vos données. Une nouvelle autorisation sera nécessaire lors de votre prochaine connexion.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => void handleRevoke(clientId),
        },
      ],
    )
  }

  async function handleRevoke(clientId: string) {
    setRevoking(clientId)
    try {
      await revoke({ clientId })
      Alert.alert(
        "Accès retiré",
        "Le consentement et les jetons actifs ont été révoqués.",
      )
    } catch (caught) {
      Alert.alert(
        "Révocation impossible",
        caught instanceof Error ? caught.message : "Veuillez réessayer.",
      )
    } finally {
      setRevoking(null)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Consentements"
        sub={
          list === undefined
            ? "Chargement…"
            : list.length === 0
              ? "Aucune application externe autorisée."
              : `${list.length} application${list.length > 1 ? "s" : ""} autorisée${list.length > 1 ? "s" : ""}.`
        }
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: Math.max(insets.bottom, 24),
          gap: 12,
        }}
      >
        {list?.map((consent) => (
          <View
            key={consent.id}
            style={{
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 14,
              padding: 16,
              gap: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  backgroundColor: t.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "700", color: t.ink }}>
                  {consent.appName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 14, fontWeight: "600" }}>
                  {consent.appName}
                </Text>
                <Text style={{ color: t.muted, fontSize: 11, marginTop: 3 }}>
                  Accès accordé le{" "}
                  {new Date(consent.grantedAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </View>
            {consent.scopes.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {consent.scopes.map((scope) => (
                  <View
                    key={scope}
                    style={{
                      backgroundColor: t.surface2,
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: idnTokens.mono,
                        fontSize: 10,
                        color: t.muted,
                      }}
                    >
                      {scope}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <IdnButton
              t={t}
              variant="danger"
              size="sm"
              onPress={() => confirm(consent.clientId, consent.appName)}
              disabled={revoking === consent.clientId}
            >
              {revoking === consent.clientId
                ? "Révocation…"
                : "Retirer l’accès"}
            </IdnButton>
          </View>
        ))}
        {list?.length === 0 ? (
          <View
            style={{
              padding: 24,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: t.ink, fontSize: 14, fontWeight: "600" }}>
              Vos partages apparaîtront ici
            </Text>
            <Text
              style={{
                color: t.muted,
                fontSize: 12,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Vous gardez le contrôle sur chaque application connectée.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
