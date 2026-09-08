import React from "react"
import { Alert, Pressable, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NLargeHeader } from "@/components/chrome/large-header"
import { NativeLiveKitRoom } from "@/components/native-livekit-room"
import { IdnButton } from "@/design/components/idn-button"
import { Icon } from "@/design/icons"
import { useIdnTheme } from "@/design/theme"
import { idnTokens } from "@/design/tokens"
import { api } from "@/lib/api"
import {
  canJoinLevel3,
  formatLevel3Appointment,
  formatLevel3Time,
  groupLevel3Slots,
  LEVEL3_JOIN_EARLY_MS,
} from "@/lib/level3"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

type Credentials = { serverUrl: string; token: string; roomName: string }

export default function LevelThree() {
  const t = useIdnTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.profile.getCurrentUser, isAuthenticated ? {} : "skip")
  const verification = useQuery(
    api.level3.getMine,
    isAuthenticated ? {} : "skip",
  )
  const shouldLoadSlots =
    verification != null &&
    (verification.status === "waiting_controller" ||
      verification.status === "claimed")
  const slots = useQuery(
    api.level3.scheduling.listAvailable,
    shouldLoadSlots ? {} : "skip",
  )
  const request = useMutation(api.verification.request)
  const cancel = useMutation(api.level3.cancel)
  const book = useMutation(api.level3.scheduling.book)
  const issueJoinToken = useAction(api.level3.livekit.issueJoinToken)
  const [pending, setPending] = React.useState<string | null>(null)
  const [credentials, setCredentials] = React.useState<Credentials | null>(null)
  const [showSlots, setShowSlots] = React.useState(false)
  const [now, setNow] = React.useState(Date.now())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  async function start() {
    if ((me?.profile?.loa ?? 1) < 2) {
      router.replace("/kyc/intro?target=3" as never)
      return
    }
    setPending("start")
    try {
      await request({ targetLoa: 3 })
      setShowSlots(true)
    } catch (caught) {
      Alert.alert(
        "Démarrage impossible",
        caught instanceof Error ? caught.message : "Veuillez réessayer.",
      )
    } finally {
      setPending(null)
    }
  }

  async function onBook(slotId: Id<"level3AppointmentSlot">) {
    if (!verification) return
    setPending(slotId)
    try {
      await book({ verificationId: verification._id, slotId })
      setShowSlots(false)
      Alert.alert(
        "Rendez-vous confirmé",
        "Un rappel vous sera envoyé la veille.",
      )
    } catch (caught) {
      Alert.alert(
        "Créneau indisponible",
        caught instanceof Error
          ? caught.message
          : "Choisissez un autre créneau.",
      )
    } finally {
      setPending(null)
    }
  }

  function confirmCancel() {
    if (!verification) return
    Alert.alert(
      "Annuler ce rendez-vous ?",
      "Le créneau sera rendu disponible.",
      [
        { text: "Conserver", style: "cancel" },
        {
          text: "Annuler le rendez-vous",
          style: "destructive",
          onPress: () => void onCancel(),
        },
      ],
    )
  }

  async function onCancel() {
    if (!verification) return
    setPending("cancel")
    try {
      await cancel({ verificationId: verification._id })
      setShowSlots(false)
    } catch (caught) {
      Alert.alert(
        "Annulation impossible",
        caught instanceof Error ? caught.message : "Veuillez réessayer.",
      )
    } finally {
      setPending(null)
    }
  }

  async function join() {
    if (!verification) return
    setPending("join")
    try {
      setCredentials(await issueJoinToken({ verificationId: verification._id }))
    } catch (caught) {
      Alert.alert(
        "Connexion impossible",
        caught instanceof Error ? caught.message : "Veuillez réessayer.",
      )
    } finally {
      setPending(null)
    }
  }

  if (
    credentials &&
    verification &&
    (verification.status === "claimed" ||
      verification.status === "in_interview")
  ) {
    return (
      <View
        style={{ flex: 1, backgroundColor: "#0B0D0B", paddingTop: insets.top }}
      >
        <View
          style={{ padding: 14, flexDirection: "row", alignItems: "center" }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              Entretien Niveau 3
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.62)",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Avec {verification.controllerName ?? "le contrôleur IDN"}
            </Text>
          </View>
          <Pressable onPress={() => setCredentials(null)}>
            <Text style={{ color: "#fff", fontSize: 13 }}>Fermer</Text>
          </Pressable>
        </View>
        <NativeLiveKitRoom
          credentials={credentials}
          onLeave={() => setCredentials(null)}
          onError={(message) => Alert.alert("Entretien vidéo", message)}
        />
        <Text
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 11,
            lineHeight: 16,
            padding: 14,
            paddingBottom: Math.max(insets.bottom, 14),
          }}
        >
          Présentez votre pièce à la caméra. La vidéo n’est pas enregistrée.
        </Text>
      </View>
    )
  }

  const status = verification?.status
  const alreadyLevel3 = (me?.profile?.loa ?? 1) >= 3 || status === "approved"
  const canStart =
    !alreadyLevel3 &&
    (!verification || status === "cancelled" || status === "rejected")
  const hasAppointment = Boolean(
    verification &&
    (status === "claimed" || status === "in_interview") &&
    verification.scheduledAt !== undefined,
  )
  const canJoin = Boolean(
    hasAppointment &&
    canJoinLevel3(verification?.scheduledAt, verification?.scheduledEndAt, now),
  )

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Niveau 3"
        sub="Entretien vidéo avec un contrôleur habilité."
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: Math.max(insets.bottom, 24),
          gap: 14,
        }}
      >
        <View
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: t.dark ? "#0F2A18" : idnTokens.greenSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="shield" size={26} color={idnTokens.green} />
          </View>
          <Text
            style={{
              color: t.ink,
              fontSize: 20,
              fontWeight: "700",
              marginTop: 16,
            }}
          >
            Garantie d’identité élevée
          </Text>
          <Text
            style={{
              color: t.muted,
              fontSize: 12,
              lineHeight: 18,
              marginTop: 7,
            }}
          >
            Choisissez un créneau, puis présentez votre pièce d’identité en
            vidéo. Votre niveau actuel reste actif pendant la procédure.
          </Text>
        </View>

        {alreadyLevel3 ? (
          <Panel
            t={t}
            title="Niveau 3 accordé"
            body="Votre entretien a été validé. Votre profil bénéficie du niveau de garantie élevé."
            color={idnTokens.green}
          />
        ) : null}
        {status === "rejected" ? (
          <Panel
            t={t}
            title="Demande non validée"
            body={
              verification?.rejectionReason ??
              "Le contrôleur n’a pas pu valider cet entretien."
            }
            color="#B83A3A"
          />
        ) : null}

        {status === "waiting_controller" && verification ? (
          <Panel
            t={t}
            title="Choisissez votre rendez-vous"
            body="Tous les horaires sont affichés à l’heure de Libreville."
            color={idnTokens.blue}
          >
            <SlotPicker t={t} slots={slots} pending={pending} onBook={onBook} />
            <IdnButton
              t={t}
              variant="quiet"
              size="sm"
              onPress={confirmCancel}
              disabled={pending !== null}
            >
              Annuler la demande
            </IdnButton>
          </Panel>
        ) : null}

        {hasAppointment && verification?.scheduledAt !== undefined ? (
          <Panel
            t={t}
            title="Votre entretien est planifié"
            body={`${formatLevel3Appointment(verification.scheduledAt, verification.scheduledEndAt)}\nAvec ${verification.controllerName ?? "un contrôleur IDN"} · heure de Libreville`}
            color={idnTokens.green}
          >
            <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
              {canJoin
                ? "La salle est ouverte. Préparez votre pièce, votre caméra et votre micro."
                : `La salle ouvrira 15 minutes avant, à ${formatLevel3Time(verification.scheduledAt - LEVEL3_JOIN_EARLY_MS)}.`}
            </Text>
            <IdnButton
              t={t}
              size="md"
              full
              onPress={join}
              disabled={!canJoin || pending !== null}
            >
              {pending === "join" ? "Connexion…" : "Rejoindre l’entretien"}
            </IdnButton>
            <IdnButton
              t={t}
              variant="ghost"
              size="sm"
              onPress={() => setShowSlots((value) => !value)}
            >
              {showSlots ? "Conserver ce créneau" : "Changer de créneau"}
            </IdnButton>
            <IdnButton t={t} variant="quiet" size="sm" onPress={confirmCancel}>
              Annuler le rendez-vous
            </IdnButton>
            {showSlots ? (
              <SlotPicker
                t={t}
                slots={slots}
                pending={pending}
                onBook={onBook}
              />
            ) : null}
          </Panel>
        ) : null}

        {status === "claimed" && verification?.scheduledAt === undefined ? (
          <Panel
            t={t}
            title="Le contrôleur vous attend"
            body="Cet entretien peut être rejoint maintenant."
            color={idnTokens.blue}
          >
            <IdnButton t={t} full onPress={join}>
              Rejoindre l’entretien
            </IdnButton>
          </Panel>
        ) : null}

        {canStart ? (
          <IdnButton
            t={t}
            size="lg"
            full
            onPress={start}
            disabled={pending !== null}
          >
            {pending === "start"
              ? "Création…"
              : status === "rejected"
                ? "Choisir un nouveau rendez-vous"
                : "Planifier mon entretien"}
          </IdnButton>
        ) : null}
      </ScrollView>
    </View>
  )
}

function Panel({
  t,
  title,
  body,
  color,
  children,
}: {
  t: ReturnType<typeof useIdnTheme>
  title: string
  body: string
  color: string
  children?: React.ReactNode
}) {
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: color,
        borderRadius: 14,
        padding: 16,
        gap: 12,
      }}
    >
      <Text style={{ color: t.ink, fontSize: 14, fontWeight: "700" }}>
        {title}
      </Text>
      <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
        {body}
      </Text>
      {children}
    </View>
  )
}

function SlotPicker({
  t,
  slots,
  pending,
  onBook,
}: {
  t: ReturnType<typeof useIdnTheme>
  slots:
    | undefined
    | {
        _id: Id<"level3AppointmentSlot">
        startsAt: number
        endsAt: number
        controllerName: string
      }[]
  pending: string | null
  onBook: (id: Id<"level3AppointmentSlot">) => Promise<void>
}) {
  if (slots === undefined)
    return (
      <Text style={{ color: t.muted, fontSize: 12 }}>
        Chargement des créneaux…
      </Text>
    )
  if (slots.length === 0)
    return (
      <Text style={{ color: t.muted, fontSize: 12 }}>
        Aucun créneau disponible. Revenez un peu plus tard.
      </Text>
    )
  return (
    <View style={{ gap: 14 }}>
      {groupLevel3Slots(slots).map(([date, daySlots]) => (
        <View key={date} style={{ gap: 8 }}>
          <Text
            style={{
              color: t.ink,
              fontSize: 12,
              fontWeight: "700",
              textTransform: "capitalize",
            }}
          >
            {date}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {daySlots.map((slot) => (
              <Pressable
                key={slot._id}
                onPress={() => void onBook(slot._id)}
                disabled={pending !== null}
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface2,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: t.ink, fontSize: 12, fontWeight: "600" }}>
                  {pending === slot._id
                    ? "…"
                    : `${formatLevel3Time(slot.startsAt)} – ${formatLevel3Time(slot.endsAt)}`}
                </Text>
                <Text style={{ color: t.muted, fontSize: 9, marginTop: 2 }}>
                  {slot.controllerName}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}
