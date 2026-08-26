import React, { useState } from "react"
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as LocalAuth from "expo-local-authentication"
import { useIdnTheme } from "@/design/theme"
import { idnTokens } from "@/design/tokens"
import { NLargeHeader } from "@/components/chrome/large-header"
import { SetMobileRow } from "@/components/rows/setting-row"
import { IdnButton } from "@/design/components/idn-button"
import { IdnInput } from "@/design/components/idn-input"
import { Toggle } from "@/design/components/toggle"
import { Icon } from "@/design/icons"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { BIOMETRIC_KEY } from "@/app/(auth)/signup/bio"

type Passkey = { id: string; name?: string; createdAt: string | number | Date }

function fmtDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function PinChangeModal({
  visible,
  configured,
  onClose,
}: {
  visible: boolean
  configured: boolean
  onClose: () => void
}) {
  const t = useIdnTheme()
  const insets = useSafeAreaInsets()
  const createPin = useMutation(api.onboarding.createPin)
  const changePin = useMutation(api.onboarding.changePin)
  const [phase, setPhase] = useState<"check" | "new" | "confirm">("check")
  const [pin, setPin] = useState("")
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setPhase(configured ? "check" : "new")
    setPin("")
    setCurrentPin("")
    setNewPin("")
    setError(null)
    setSubmitting(false)
  }

  function close() {
    reset()
    onClose()
  }

  async function complete(value: string) {
    setError(null)
    if (phase === "check") {
      setCurrentPin(value)
      setPhase("new")
      setPin("")
      return
    }
    if (phase === "new") {
      setNewPin(value)
      setPhase("confirm")
      setPin("")
      return
    }
    if (value !== newPin) {
      setError("Les deux codes PIN ne correspondent pas.")
      setPhase("new")
      setPin("")
      setNewPin("")
      return
    }
    setSubmitting(true)
    try {
      if (configured) await changePin({ currentPin, newPin: value })
      else await createPin({ pin: value })
      close()
      Alert.alert("Code PIN modifié", "Votre nouveau code PIN est actif.")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Modification impossible.",
      )
      setPin("")
      setSubmitting(false)
    }
  }

  function press(key: string) {
    if (!key || submitting) return
    if (key === "⌫") {
      setPin((value) => value.slice(0, -1))
      return
    }
    if (pin.length >= 6) return
    const value = pin + key
    setPin(value)
    if (value.length === 6) void complete(value)
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"]
  const title =
    phase === "check"
      ? "Code PIN actuel"
      : phase === "new"
        ? "Nouveau code PIN"
        : "Confirmez le code PIN"

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={reset}
      onRequestClose={close}
    >
      <View
        style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}
      >
        <View
          style={{
            minHeight: 52,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: t.borderSoft,
          }}
        >
          <Pressable onPress={close}>
            <Text style={{ color: idnTokens.green, fontSize: 14 }}>
              Annuler
            </Text>
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 15,
              fontWeight: "600",
              color: t.ink,
            }}
          >
            {title}
          </Text>
          <View style={{ width: 52 }} />
        </View>
        <View style={{ flex: 1, padding: 22 }}>
          <Text
            style={{
              textAlign: "center",
              color: t.muted,
              fontSize: 13,
              marginTop: 8,
            }}
          >
            Saisissez les 6 chiffres.
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 16,
              paddingVertical: 24,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  backgroundColor:
                    index < pin.length ? idnTokens.green : "transparent",
                  borderWidth: 2,
                  borderColor: index < pin.length ? idnTokens.green : t.border,
                }}
              />
            ))}
          </View>
          {error ? (
            <Text
              style={{
                textAlign: "center",
                color: idnTokens.danger,
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              {error}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginHorizontal: -5,
            }}
          >
            {keys.map((key, index) => (
              <View key={index} style={{ width: "33.3333%", padding: 5 }}>
                <Pressable
                  disabled={!key || submitting}
                  onPress={() => press(key)}
                  style={{
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: key ? t.surface : "transparent",
                    borderWidth: key ? 1 : 0,
                    borderColor: t.borderSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      color: t.ink,
                      fontFamily: idnTokens.mono,
                    }}
                  >
                    {key}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

function NipChangeModal({
  visible,
  currentNip,
  onClose,
}: {
  visible: boolean
  currentNip?: string
  onClose: () => void
}) {
  const t = useIdnTheme()
  const insets = useSafeAreaInsets()
  const updateNip = useMutation(api.profile.updateNip)
  const [nip, setNip] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function close() {
    setNip("")
    setError(null)
    setSubmitting(false)
    onClose()
  }

  async function submit() {
    if (!/^[A-Za-z0-9]{14}$/.test(nip)) {
      setError("Le NIP doit contenir exactement 14 lettres ou chiffres.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await updateNip({ nip })
      close()
      Alert.alert(
        "NIP enregistré",
        "Votre numéro d’identification personnelle a été mis à jour.",
      )
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Mise à jour impossible.",
      )
      setSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View
        style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}
      >
        <View
          style={{
            minHeight: 52,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: t.borderSoft,
          }}
        >
          <Pressable onPress={close}>
            <Text style={{ color: idnTokens.green, fontSize: 14 }}>
              Annuler
            </Text>
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              color: t.ink,
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            {currentNip ? "Modifier le NIP" : "Définir le NIP"}
          </Text>
          <View style={{ width: 52 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 22, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
            Le NIP RBPP comporte exactement 14 caractères.
          </Text>
          <IdnInput
            t={t}
            label="NIP (RBPP)"
            value={nip}
            onChangeText={(value) =>
              setNip(value.replace(/[^A-Za-z0-9]/g, "").slice(0, 14))
            }
            placeholder="14 caractères"
            autoFocus
          />
          {error ? (
            <Text style={{ color: idnTokens.danger, fontSize: 12 }}>
              {error}
            </Text>
          ) : null}
          <IdnButton
            t={t}
            size="lg"
            full
            onPress={submit}
            disabled={submitting || nip.length !== 14}
          >
            {submitting ? "Enregistrement…" : "Enregistrer le NIP"}
          </IdnButton>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function SettingsSecurity() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(
    api.profile.getCurrentUser,
    isAuthenticated ? {} : "skip",
  )
  const [pinOpen, setPinOpen] = useState(false)
  const [nipOpen, setNipOpen] = useState(false)
  const [faceUnlock, setFaceUnlock] = useState(false)
  const [passkeys, setPasskeys] = useState<Passkey[] | undefined>()
  const [pkError, setPkError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadPasskeys = React.useCallback(async () => {
    try {
      const result = await authClient.passkey.listUserPasskeys()
      if (result?.error)
        throw new Error(result.error.message ?? "Chargement impossible.")
      setPasskeys((result?.data ?? []) as Passkey[])
      setPkError(null)
    } catch (caught) {
      setPasskeys([])
      setPkError(
        caught instanceof Error ? caught.message : "Chargement impossible.",
      )
    }
  }, [])

  React.useEffect(() => {
    void AsyncStorage.getItem(BIOMETRIC_KEY).then((flag) =>
      setFaceUnlock(flag === "1"),
    )
  }, [])

  React.useEffect(() => {
    if (isAuthenticated) void loadPasskeys()
  }, [isAuthenticated, loadPasskeys])

  async function toggleBiometrics(enabled: boolean) {
    if (!enabled) {
      await AsyncStorage.setItem(BIOMETRIC_KEY, "0")
      setFaceUnlock(false)
      return
    }
    try {
      if (Platform.OS !== "web") {
        const [hardware, enrolled] = await Promise.all([
          LocalAuth.hasHardwareAsync(),
          LocalAuth.isEnrolledAsync(),
        ])
        if (!hardware || !enrolled) {
          Alert.alert(
            "Biométrie indisponible",
            "Configurez Face ID, Touch ID ou la biométrie Android dans les réglages de l’appareil.",
          )
          return
        }
      }
      const existing = passkeys?.some(
        (passkey) => passkey.name === "Biométrie de cet appareil",
      )
      if (!existing) {
        const result = await authClient.passkey.addPasskey({
          name: "Biométrie de cet appareil",
        })
        if (result?.error)
          throw new Error(result.error.message ?? "Activation impossible.")
      }
      await AsyncStorage.setItem(BIOMETRIC_KEY, "1")
      setFaceUnlock(true)
      await loadPasskeys()
    } catch (caught) {
      await AsyncStorage.setItem(BIOMETRIC_KEY, "0")
      setFaceUnlock(false)
      Alert.alert(
        "Activation impossible",
        caught instanceof Error ? caught.message : "Réessayez plus tard.",
      )
    }
  }

  async function addSecurityKey() {
    if (adding) return
    setAdding(true)
    setPkError(null)
    try {
      const result = await authClient.passkey.addPasskey({
        name: `Clé de sécurité · ${fmtDate(Date.now())}`,
        authenticatorAttachment: "cross-platform",
      })
      if (result?.error)
        throw new Error(result.error.message ?? "Ajout impossible.")
      await loadPasskeys()
    } catch (caught) {
      setPkError(caught instanceof Error ? caught.message : "Ajout impossible.")
    } finally {
      setAdding(false)
    }
  }

  function removePasskey(passkey: Passkey) {
    Alert.alert(
      "Supprimer cette clé ?",
      `${passkey.name || "Clé sans nom"} ne pourra plus servir à vous connecter.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(passkey.id)
            try {
              const result = await authClient.passkey.deletePasskey({
                id: passkey.id,
              })
              if (result?.error)
                throw new Error(
                  result.error.message ?? "Suppression impossible.",
                )
              await loadPasskeys()
            } catch (caught) {
              setPkError(
                caught instanceof Error
                  ? caught.message
                  : "Suppression impossible.",
              )
            } finally {
              setDeleting(null)
            }
          },
        },
      ],
    )
  }

  const pinConfigured = user?.profile?.pinConfigured ?? false
  const currentNip = user?.profile?.pivot?.nip
  const keySummary = pkError
    ? pkError
    : passkeys === undefined
      ? "Chargement…"
      : `${passkeys.length} clé${passkeys.length > 1 ? "s" : ""} enregistrée${passkeys.length > 1 ? "s" : ""}`

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Sécurité"
        sub="Code PIN, biométrie et clés de sécurité."
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 4,
          paddingBottom: 22,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: t.muted,
            letterSpacing: 1.2,
            fontWeight: "600",
            paddingHorizontal: 4,
            paddingVertical: 6,
          }}
        >
          IDENTIFIANTS
        </Text>
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
            label="Code PIN"
            value={pinConfigured ? "6 chiffres · configuré" : "Non configuré"}
            onPress={() => setPinOpen(true)}
          />
          <SetMobileRow
            t={t}
            label="NIP (RBPP)"
            value={
              currentNip
                ? `Configuré · ${currentNip.slice(0, 4)}••••••${currentNip.slice(-4)}`
                : "Non configuré"
            }
            onPress={() => setNipOpen(true)}
          />
        </View>
        <Text
          style={{
            fontSize: 10,
            color: t.muted,
            letterSpacing: 1.2,
            fontWeight: "600",
            paddingHorizontal: 4,
            paddingTop: 14,
            paddingBottom: 6,
          }}
        >
          BIOMÉTRIE
        </Text>
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
            label="Déverrouiller l’app"
            value="Face ID, Touch ID ou équivalent"
            right={<Toggle on={faceUnlock} onChange={toggleBiometrics} t={t} />}
          />
        </View>
        <Text
          style={{
            fontSize: 10,
            color: t.muted,
            letterSpacing: 1.2,
            fontWeight: "600",
            paddingHorizontal: 4,
            paddingTop: 14,
            paddingBottom: 6,
          }}
        >
          CLÉS DE SÉCURITÉ
        </Text>
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
            label="Passkeys et clés FIDO2"
            value={keySummary}
            right={
              <IdnButton
                t={t}
                variant="ghost"
                size="sm"
                onPress={addSecurityKey}
                disabled={adding}
              >
                {adding ? "Ajout…" : "Ajouter"}
              </IdnButton>
            }
          />
          {(passkeys ?? []).map((passkey) => (
            <SetMobileRow
              key={passkey.id}
              t={t}
              label={passkey.name || "Clé sans nom"}
              value={`Ajoutée le ${fmtDate(passkey.createdAt)}`}
              right={
                <IdnButton
                  t={t}
                  variant="danger"
                  size="sm"
                  onPress={() => removePasskey(passkey)}
                  disabled={deleting !== null}
                >
                  {deleting === passkey.id ? "Suppression…" : "Supprimer"}
                </IdnButton>
              }
            />
          ))}
        </View>
        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 14,
            backgroundColor: t.dark ? "#10243A" : idnTokens.blueSoft,
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Icon name="shield" size={18} color={idnTokens.blue} />
          <Text
            style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 18 }}
          >
            Le code PIN reste disponible si la biométrie échoue ou si vous
            changez d’appareil.
          </Text>
        </View>
      </ScrollView>
      <PinChangeModal
        visible={pinOpen}
        configured={pinConfigured}
        onClose={() => setPinOpen(false)}
      />
      <NipChangeModal
        visible={nipOpen}
        currentNip={currentNip}
        onClose={() => setNipOpen(false)}
      />
    </View>
  )
}
