import React from "react"
import { Platform, Pressable, Text, View } from "react-native"
import type { TrackReference } from "@livekit/react-native"
import { Track } from "livekit-client"

import { Icon } from "@/design/icons"
import { idnTokens } from "@/design/tokens"

type Credentials = { serverUrl: string; token: string; roomName: string }

function getNativeLiveKit() {
  return require("@livekit/react-native") as typeof import("@livekit/react-native")
}

export function NativeLiveKitRoom({
  credentials,
  onLeave,
  onError,
}: {
  credentials: Credentials
  onLeave: () => void
  onError: (message: string) => void
}) {
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <Text style={{ textAlign: "center" }}>
          L’entretien vidéo est disponible dans l’application iOS ou Android.
        </Text>
      </View>
    )
  }
  const { LiveKitRoom } = getNativeLiveKit()
  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video
      options={{ adaptiveStream: true, dynacast: true }}
      onDisconnected={onLeave}
      onError={(error) => onError(error.message)}
    >
      <RoomContent onLeave={onLeave} onError={onError} />
    </LiveKitRoom>
  )
}

function RoomContent({
  onLeave,
  onError,
}: {
  onLeave: () => void
  onError: (message: string) => void
}) {
  const { isTrackReference, useRoomContext, useTracks, VideoTrack } =
    getNativeLiveKit()
  const room = useRoomContext()
  const tracks = useTracks([Track.Source.Camera])
  const references = tracks.filter(isTrackReference) as TrackReference[]
  const remote = references.find((reference) => !reference.participant.isLocal)
  const local = references.find((reference) => reference.participant.isLocal)
  const [camera, setCamera] = React.useState(true)
  const [microphone, setMicrophone] = React.useState(true)

  async function toggleCamera() {
    try {
      const next = !camera
      await room.localParticipant.setCameraEnabled(next)
      setCamera(next)
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Caméra indisponible.")
    }
  }

  async function toggleMicrophone() {
    try {
      const next = !microphone
      await room.localParticipant.setMicrophoneEnabled(next)
      setMicrophone(next)
    } catch (caught) {
      onError(
        caught instanceof Error ? caught.message : "Microphone indisponible.",
      )
    }
  }

  async function leave() {
    await room.disconnect()
    onLeave()
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0D0B" }}>
      {remote ? (
        <VideoTrack trackRef={remote} style={{ flex: 1 }} objectFit="cover" />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 28,
          }}
        >
          <Icon name="user" size={42} color="rgba(255,255,255,0.45)" />
          <Text
            style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: "600",
              marginTop: 12,
            }}
          >
            En attente du contrôleur…
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.62)",
              fontSize: 12,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Gardez cette salle ouverte. La connexion est chiffrée.
          </Text>
        </View>
      )}
      {local ? (
        <VideoTrack
          trackRef={local}
          style={{
            position: "absolute",
            width: 112,
            height: 156,
            right: 14,
            top: 14,
            borderRadius: 14,
            overflow: "hidden",
          }}
          objectFit="cover"
          mirror
          zOrder={1}
        />
      ) : null}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <Control
          icon="camera"
          label={camera ? "Caméra" : "Caméra coupée"}
          active={camera}
          onPress={() => void toggleCamera()}
        />
        <Control
          icon="close"
          label="Quitter"
          danger
          onPress={() => void leave()}
        />
        <Control
          icon="mic"
          label={microphone ? "Micro" : "Micro coupé"}
          active={microphone}
          onPress={() => void toggleMicrophone()}
        />
      </View>
    </View>
  )
}

function Control({
  icon,
  label,
  active = true,
  danger,
  onPress,
}: {
  icon: "camera" | "close" | "mic"
  label: string
  active?: boolean
  danger?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: danger ? 62 : 52,
        height: danger ? 62 : 52,
        borderRadius: 999,
        backgroundColor: danger
          ? "#B83A3A"
          : active
            ? "rgba(255,255,255,0.2)"
            : "rgba(184,58,58,0.8)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
      }}
    >
      <Icon
        name={icon}
        size={danger ? 24 : 20}
        color={danger ? "#fff" : active ? "#fff" : idnTokens.yellowSoft}
      />
    </Pressable>
  )
}
