import React from "react"
import { Alert, Linking, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useConvexAuth, useQuery } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { SetMobileRow } from "@/components/rows/setting-row"
import { useIdnTheme } from "@/design/theme"
import { api } from "@/lib/api"

const LABELS = {
  profilePhoto: "Photo de profil",
  kycDocFront: "Pièce d’identité — recto",
  kycDocBack: "Pièce d’identité — verso",
  selfie: "Selfie de vérification",
  attestation: "Attestation",
} as const

export default function AccountDocuments() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useConvexAuth()
  const documents = useQuery(
    api.documents.listMine,
    isAuthenticated ? {} : "skip",
  )

  async function open(url: string | null) {
    if (!url)
      return Alert.alert(
        "Fichier indisponible",
        "Ce document ne peut pas être ouvert pour le moment.",
      )
    await Linking.openURL(url)
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Mes documents d’identité"
        sub="Pièces utilisées pour votre compte et vos vérifications."
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
          {documents?.map((document) => (
            <SetMobileRow
              key={document._id}
              t={t}
              label={LABELS[document.type]}
              value={`Ajouté le ${new Date(document.createdAt).toLocaleDateString("fr-FR")}${document.expiresAt ? ` · expire le ${new Date(document.expiresAt).toLocaleDateString("fr-FR")}` : ""}`}
              onPress={() => void open(document.url)}
            />
          ))}
          {documents?.length === 0 ? (
            <View style={{ padding: 22 }}>
              <Text
                style={{ textAlign: "center", color: t.muted, fontSize: 12 }}
              >
                Aucun document d’identité enregistré.
              </Text>
            </View>
          ) : null}
          {documents === undefined ? (
            <View style={{ padding: 22 }}>
              <Text
                style={{ textAlign: "center", color: t.muted, fontSize: 12 }}
              >
                Chargement…
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}
