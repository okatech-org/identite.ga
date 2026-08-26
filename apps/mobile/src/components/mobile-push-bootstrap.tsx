import React from "react"
import { Platform } from "react-native"
import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"
import { useConvexAuth, useMutation } from "convex/react"
import { api } from "@/lib/api"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function openNotificationUrl(url: unknown, push: (path: string) => void) {
  if (typeof url !== "string") return
  const messageId = /[?&]id=([^&]+)/.exec(url)?.[1]
  if (messageId) {
    push(`/iboite/email/${decodeURIComponent(messageId)}`)
    return
  }
  if (url.startsWith("/")) push(url)
}

export function MobilePushBootstrap() {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const subscribe = useMutation(api.nativePushSubscriptions.subscribe)
  const registered = React.useRef(false)

  React.useEffect(() => {
    if (Platform.OS === "web") return
    const listener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        openNotificationUrl(
          response.notification.request.content.data?.url,
          (path) => router.push(path as never),
        )
      },
    )
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        openNotificationUrl(
          response.notification.request.content.data?.url,
          (path) => router.push(path as never),
        )
      }
    })
    return () => listener.remove()
  }, [router])

  React.useEffect(() => {
    if (!isAuthenticated) {
      registered.current = false
      return
    }
    if (Platform.OS === "web" || registered.current) return
    registered.current = true
    void (async () => {
      if (!Device.isDevice) {
        registered.current = false
        return
      }
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("messages", {
          name: "Nouveaux messages",
          description: "E-mails et courriers reçus dans iBoîte",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 180, 120, 180],
        })
      }
      const current = await Notifications.getPermissionsAsync()
      const permission = current.granted
        ? current
        : await Notifications.requestPermissionsAsync()
      if (!permission.granted) {
        registered.current = false
        return
      }
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId
      if (!projectId) {
        registered.current = false
        return
      }
      const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data
      await subscribe({
        token,
        platform: Platform.OS as "ios" | "android",
        deviceName: Device.deviceName ?? undefined,
      })
    })().catch(() => {
      registered.current = false
    })
  }, [isAuthenticated, subscribe])

  return null
}
