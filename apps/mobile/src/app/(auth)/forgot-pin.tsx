import React, { useState } from "react"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import { useLocalSearchParams, useRouter, type Href } from "expo-router"
import { useAction, useMutation } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { api } from "@/lib/api"
import { Icon } from "@/design/icons"
import { IdnButton } from "@/design/components/idn-button"
import { IdnInput } from "@/design/components/idn-input"
import { useIdnTheme } from "@/design/theme"
import { idnTokens } from "@/design/tokens"

const HANDLE_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/
const IDN_DOMAIN = "@idn.ga"
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"]

type Phase = "request" | "code" | "new-pin" | "confirm" | "done"

export default function ForgotPin() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ identifier?: string | string[] }>()
  const initialIdentifier = Array.isArray(params.identifier)
    ? (params.identifier[0] ?? "")
    : (params.identifier ?? "")
  const requestReset = useAction(api.pinRecovery.requestReset)
  const verifyCode = useAction(api.pinRecovery.verifyCode)
  const resetPin = useMutation(api.pinRecovery.resetPin)

  const [phase, setPhase] = useState<Phase>("request")
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [requestId, setRequestId] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [code, setCode] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const normalizedEmail = normalizeIdnIdentifier(identifier)
  const activeValue =
    phase === "code" ? code : phase === "new-pin" ? newPin : confirmPin

  function returnToLogin() {
    const target = normalizedEmail
      ? `/(auth)/login?identifier=${encodeURIComponent(normalizedEmail)}`
      : "/(auth)/login"
    router.replace(target as Href)
  }

  async function sendCode() {
    if (!normalizedEmail || submitting) {
      setError("Saisissez un identifiant IDN valide.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await requestReset({ identifier: normalizedEmail })
      setRequestId(result.requestId)
      setCode("")
      setPhase("code")
    } catch {
      setError("Envoi impossible pour le moment. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  async function checkCode() {
    if (code.length !== 6 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await verifyCode({ requestId, code })
      if (!result.verified || !result.resetToken) {
        setCode("")
        setError("Code incorrect ou expiré. Recommencez si nécessaire.")
        return
      }
      setResetToken(result.resetToken)
      setPhase("new-pin")
    } catch {
      setCode("")
      setError("Code incorrect ou expiré. Recommencez si nécessaire.")
    } finally {
      setSubmitting(false)
    }
  }

  async function savePin() {
    if (newPin.length !== 6 || confirmPin.length !== 6 || submitting) return
    if (newPin !== confirmPin) {
      setConfirmPin("")
      setError("Les deux PIN ne correspondent pas.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await resetPin({ requestId, resetToken, newPin })
      setResetToken("")
      setPhase("done")
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Réinitialisation impossible. Réessayez.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function pressKey(key: string) {
    if (!key || submitting) return
    setError(null)
    const update = (current: string, setter: (value: string) => void) => {
      if (key === "⌫") setter(current.slice(0, -1))
      else if (current.length < 6) setter(current + key)
    }
    if (phase === "code") update(code, setCode)
    else if (phase === "new-pin") update(newPin, setNewPin)
    else if (phase === "confirm") update(confirmPin, setConfirmPin)
  }

  function restart() {
    setPhase("request")
    setRequestId("")
    setResetToken("")
    setCode("")
    setNewPin("")
    setConfirmPin("")
    setError(null)
  }

  const title =
    phase === "request"
      ? "Récupérer votre PIN"
      : phase === "code"
        ? "Code reçu par SMS"
        : phase === "new-pin"
          ? "Choisissez un nouveau PIN"
          : phase === "confirm"
            ? "Confirmez le nouveau PIN"
            : "Votre PIN a été modifié"
  const subtitle =
    phase === "request"
      ? "Si un numéro mobile compatible est associé au compte, un code sera envoyé par SMS."
      : phase === "code"
        ? "Saisissez le code à 6 chiffres. L'envoi peut prendre quelques instants."
        : phase === "done"
          ? "Toutes les anciennes sessions ont été fermées. Vous pouvez maintenant vous reconnecter."
          : "Votre PIN doit contenir exactement 6 chiffres."

  return (
    <View
      style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 12 }}
    >
      <Pressable
        onPress={
          phase === "request" || phase === "done" ? returnToLogin : restart
        }
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 24,
        }}
      >
        <Icon name="arrowL" size={20} color={idnTokens.green} />
        <Text
          style={{
            color: idnTokens.green,
            fontSize: idnTokens.text.callout,
            fontWeight: "600",
          }}
        >
          {phase === "request" || phase === "done"
            ? "Connexion"
            : "Recommencer"}
        </Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 26,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: t.ink,
            fontSize: idnTokens.text.title,
            fontWeight: "700",
            letterSpacing: -0.4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: t.muted,
            fontSize: idnTokens.text.callout,
            lineHeight: 22,
            marginTop: 10,
          }}
        >
          {subtitle}
        </Text>

        {phase === "request" ? (
          <View style={{ marginTop: 28, gap: 20 }}>
            <IdnInput
              t={t}
              label="Identifiant IDN"
              value={identifier}
              onChangeText={(value) => {
                setIdentifier(value.toLowerCase())
                setError(null)
              }}
              placeholder="prenom.nom"
              hint="Avec ou sans @idn.ga"
              autoFocus
              leadIcon={<Icon name="user" size={20} color={t.muted} />}
            />
            <IdnButton
              t={t}
              variant="primary"
              size="lg"
              full
              onPress={sendCode}
              disabled={!normalizedEmail || submitting}
            >
              {submitting ? "Envoi…" : "Recevoir un code"}
            </IdnButton>
          </View>
        ) : null}

        {phase === "code" || phase === "new-pin" || phase === "confirm" ? (
          <View style={{ marginTop: 22 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 18,
                paddingVertical: 18,
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <View
                  key={index}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor:
                      index < activeValue.length
                        ? idnTokens.green
                        : "transparent",
                    borderWidth: 2,
                    borderColor:
                      index < activeValue.length ? idnTokens.green : t.border,
                  }}
                />
              ))}
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: -6,
              }}
            >
              {PIN_KEYS.map((key, index) => (
                <View key={index} style={{ width: "33.3333%", padding: 6 }}>
                  <Pressable
                    disabled={!key || submitting}
                    onPress={() => pressKey(key)}
                    style={{
                      height: 60,
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
                        color: t.ink,
                        fontSize: 24,
                        fontWeight: "500",
                        fontFamily: idnTokens.mono,
                      }}
                    >
                      {key}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <IdnButton
              t={t}
              variant="primary"
              size="lg"
              full
              style={{ marginTop: 18 }}
              onPress={
                phase === "code"
                  ? checkCode
                  : phase === "new-pin"
                    ? () => {
                        if (newPin.length === 6) {
                          setConfirmPin("")
                          setPhase("confirm")
                        }
                      }
                    : savePin
              }
              disabled={submitting || activeValue.length !== 6}
            >
              {submitting
                ? "Vérification…"
                : phase === "code"
                  ? "Vérifier le code"
                  : phase === "new-pin"
                    ? "Continuer"
                    : "Enregistrer le PIN"}
            </IdnButton>
            {phase === "code" ? (
              <View style={{ alignItems: "center", gap: 6, marginTop: 16 }}>
                <Text
                  style={{
                    color: t.muted,
                    fontSize: idnTokens.text.footnote,
                    textAlign: "center",
                  }}
                >
                  Rien reçu ? Le compte peut demander une vérification
                  supplémentaire.
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    void Linking.openURL(
                      "mailto:support@identite.ga?subject=Configuration%20du%20PIN",
                    )
                  }
                  style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: idnTokens.green,
                      fontSize: idnTokens.text.footnote,
                      fontWeight: "600",
                    }}
                  >
                    Contacter le support
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === "done" ? (
          <IdnButton
            t={t}
            variant="primary"
            size="lg"
            full
            style={{ marginTop: 28 }}
            onPress={returnToLogin}
          >
            Retour à la connexion
          </IdnButton>
        ) : null}

        {error ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor: t.dark ? "#3A1212" : "#FBE5E5",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text
              style={{
                color: idnTokens.danger,
                fontSize: idnTokens.text.footnote,
                lineHeight: 19,
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

function normalizeIdnIdentifier(input: string): string | null {
  const raw = input.trim().toLowerCase()
  const handle = raw.endsWith(IDN_DOMAIN)
    ? raw.slice(0, -IDN_DOMAIN.length)
    : raw
  if (handle.length < 3 || handle.length > 32 || !HANDLE_REGEX.test(handle))
    return null
  return `${handle}${IDN_DOMAIN}`
}
