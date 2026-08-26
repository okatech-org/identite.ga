import React from "react"
import { View, Text, Pressable } from "react-native"
import { idnTokens } from "@/design/tokens"
import type { IdnTheme } from "@/design/tokens"
import { Icon, type IconName } from "@/design/icons"

export type IBoiteTab = "courriers" | "colis" | "emails"

/** Compteurs réels du compte iBoîte — pas de valeurs mock. La forme suit
 *  exactement le schéma Convex `iboiteAccount.counters`. */
export type IBoiteTabCounters = {
  unreadLetters: number
  availablePackages: number
  unreadMessages: number
}

const TABS: {
  id: IBoiteTab
  label: string
  icon: IconName
  color: string
  counterKey: keyof IBoiteTabCounters
}[] = [
  {
    id: "emails",
    label: "E-mails",
    icon: "inbox",
    color: "#10b981",
    counterKey: "unreadMessages",
  },
  {
    id: "courriers",
    label: "Courrier",
    icon: "mail2",
    color: "#3b82f6",
    counterKey: "unreadLetters",
  },
  {
    id: "colis",
    label: "Colis",
    icon: "package",
    color: "#f59e0b",
    counterKey: "availablePackages",
  },
]

export function IBoiteTabs({
  t,
  active,
  counters,
  onChange,
}: {
  t: IdnTheme
  active: IBoiteTab
  /** Compteurs dénormalisés du compte (cf. `iboiteAccount.counters`). Si
   *  omis, les badges ne s'affichent pas — pas de fallback fictif. */
  counters?: IBoiteTabCounters
  onChange?: (id: IBoiteTab) => void
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 2,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 4,
        padding: 3,
        borderRadius: 11,
        backgroundColor: t.surface2,
      }}
    >
      {TABS.map((tb) => {
        const sel = tb.id === active
        const badge = counters?.[tb.counterKey] ?? 0
        return (
          <Pressable
            key={tb.id}
            onPress={() => onChange?.(tb.id)}
            style={{
              flex: 1,
              minHeight: 34,
              paddingHorizontal: 5,
              backgroundColor: sel ? t.surface : "transparent",
              borderWidth: sel ? 1 : 0,
              borderColor: t.border,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 5,
            }}
          >
            <View>
              <Icon
                name={tb.icon}
                size={15}
                color={sel ? idnTokens.green : t.muted}
              />
              {badge > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    minWidth: 14,
                    height: 14,
                    paddingHorizontal: 4,
                    borderRadius: 9999,
                    backgroundColor: idnTokens.green,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}
                  >
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: sel ? "600" : "500",
                color: sel ? idnTokens.green : t.muted,
              }}
            >
              {tb.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
