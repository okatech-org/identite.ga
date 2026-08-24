import React from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { IdnButton } from "@/design/components/idn-button"
import { IdnDateInput } from "@/design/components/idn-date-input"
import { IdnInput } from "@/design/components/idn-input"
import { Icon } from "@/design/icons"
import { useIdnTheme } from "@/design/theme"
import { idnTokens } from "@/design/tokens"
import { api } from "@/lib/api"
import {
  normalizeProfileForm,
  type ProfileForm,
  validateProfileForm,
} from "@/lib/profile-form"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

const GENDERS: { id: ProfileForm["gender"]; label: string }[] = [
  { id: "F", label: "Femme" },
  { id: "M", label: "Homme" },
  { id: "O", label: "Autre" },
  { id: "N", label: "Non précisé" },
]

const EMPTY: ProfileForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "N",
  birthPlace: "",
  nationality: "",
}

export default function ProfileEdit() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.profile.getCurrentUser, isAuthenticated ? {} : "skip")
  const updatePivot = useMutation(api.profile.updatePivot)
  const generateUploadUrl = useMutation(
    api.profile.generateProfilePhotoUploadUrl,
  )
  const setProfilePhoto = useMutation(api.profile.setProfilePhoto)
  const [form, setForm] = React.useState<ProfileForm>(EMPTY)
  const [initialized, setInitialized] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [localPhoto, setLocalPhoto] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const pivot = me?.profile?.pivot
    if (!pivot || initialized) return
    setForm({
      firstName: pivot.firstName,
      lastName: pivot.lastName,
      dateOfBirth: pivot.dateOfBirth,
      gender: pivot.gender as ProfileForm["gender"],
      birthPlace: pivot.birthPlace,
      nationality: pivot.nationality,
    })
    setInitialized(true)
  }, [initialized, me?.profile?.pivot])

  function field<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function choosePhoto() {
    setError(null)
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError("Autorisez l’accès aux photos pour choisir une image de profil.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    })
    const asset = result.canceled ? undefined : result.assets[0]
    if (!asset) return
    setUploading(true)
    try {
      const uploadUrl = await generateUploadUrl({})
      const blob = await (await fetch(asset.uri)).blob()
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
        body: blob,
      })
      if (!response.ok) throw new Error("Envoi de la photo impossible.")
      const { storageId } = (await response.json()) as { storageId: string }
      await setProfilePhoto({ storageRef: storageId as Id<"_storage"> })
      setLocalPhoto(asset.uri)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Envoi de la photo impossible.",
      )
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    const validationError = validateProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updatePivot(normalizeProfileForm(form))
      Alert.alert(
        "Profil mis à jour",
        "Vos informations ont bien été enregistrées.",
      )
      router.back()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Mise à jour impossible.",
      )
    } finally {
      setSaving(false)
    }
  }

  const photoUri = localPhoto ?? me?.profile?.photoUrl ?? null
  const initials =
    `${form.firstName[0] ?? "?"}${form.lastName[0] ?? ""}`.toUpperCase()

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Modifier mon profil"
        sub="Ces informations constituent votre identité pivot."
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: Math.max(insets.bottom, 24),
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={choosePhoto}
          disabled={uploading}
          style={{
            alignSelf: "center",
            alignItems: "center",
            gap: 8,
            marginVertical: 4,
          }}
        >
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: idnTokens.green,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
                {initials}
              </Text>
            )}
            {uploading ? (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="camera" size={15} color={idnTokens.green} />
            <Text
              style={{
                color: idnTokens.green,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Changer la photo
            </Text>
          </View>
        </Pressable>
        <IdnInput
          t={t}
          label="Prénom"
          value={form.firstName}
          onChangeText={(value) => field("firstName", value)}
        />
        <IdnInput
          t={t}
          label="Nom"
          value={form.lastName}
          onChangeText={(value) => field("lastName", value)}
        />
        <IdnDateInput
          t={t}
          label="Date de naissance"
          value={form.dateOfBirth}
          onChange={(value) => field("dateOfBirth", value)}
          maximumDate={new Date(Date.now() - 86_400_000)}
        />
        <View>
          <Text
            style={{
              fontSize: idnTokens.text.label,
              fontWeight: "600",
              color: t.ink,
              marginBottom: 8,
            }}
          >
            Genre
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {GENDERS.map((gender) => {
              const selected = form.gender === gender.id
              return (
                <Pressable
                  key={gender.id}
                  onPress={() => field("gender", gender.id)}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? idnTokens.green : t.border,
                    backgroundColor: selected
                      ? t.dark
                        ? "#0F2A18"
                        : idnTokens.greenSoft
                      : t.surface,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? idnTokens.green : t.ink,
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    {gender.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
        <IdnInput
          t={t}
          label="Lieu de naissance"
          value={form.birthPlace}
          onChangeText={(value) => field("birthPlace", value)}
        />
        <IdnInput
          t={t}
          label="Nationalité"
          value={form.nationality}
          onChangeText={(value) => field("nationality", value)}
          hint="Code pays ou nationalité (ex. GAB)."
        />
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
        <IdnButton
          t={t}
          size="lg"
          full
          onPress={save}
          disabled={saving || uploading || me === undefined}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </IdnButton>
      </ScrollView>
    </View>
  )
}
