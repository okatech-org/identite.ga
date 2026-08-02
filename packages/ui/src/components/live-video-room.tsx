"use client"

import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react"

import { cn } from "../lib/utils"

type LiveVideoRoomProps = {
  serverUrl: string
  token: string
  className?: string
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Error) => void
}

/** Salle vidéo LiveKit commune aux interfaces citoyen et contrôleur. */
export function LiveVideoRoom({
  serverUrl,
  token,
  className,
  onConnected,
  onDisconnected,
  onError,
}: LiveVideoRoomProps) {
  return (
    <div
      data-lk-theme="default"
      className={cn(
        "h-[min(68vh,720px)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-[#10120e]",
        className,
      )}
    >
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect
        audio
        video
        options={{ adaptiveStream: true, dynacast: true }}
        onConnected={onConnected}
        onDisconnected={() => onDisconnected?.()}
        onError={onError}
        className="h-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
