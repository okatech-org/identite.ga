/**
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx:1250
 * Verbatim.
 */

export type LogLevel = "info" | "warn" | "error"

export type AdminLog = {
  ts: string
  level: LogLevel
  evt: string
  user: string
  meta: string
}

export const ADMIN_LOGS: AdminLog[] = [
  { ts: "14:32:08", level: "info",  evt: "auth.success",    user: "aissatou.m@example.ga",  meta: "consulat-ga · ip 41.158.x.x" },
  { ts: "14:31:55", level: "info",  evt: "token.issued",    user: "aissatou.m@example.ga",  meta: "access · refresh · jti=7K3.." },
  { ts: "14:30:12", level: "warn",  evt: "otp.fail",        user: "+241 6X XX XX 12",       meta: "attempt 3/5" },
  { ts: "14:29:44", level: "info",  evt: "kyc.approved",    user: "marc.lefevre@example.fr", meta: "L1 → L2 · controller@identite.ga" },
  { ts: "14:28:01", level: "info",  evt: "consent.granted", user: "jb.ondo@example.ga",     meta: "sante-ga · scopes: profile,loa:3" },
  { ts: "14:27:33", level: "error", evt: "auth.fail",       user: "—",                       meta: "invalid_client · cnamgs-portal" },
  { ts: "14:26:50", level: "info",  evt: "session.revoked", user: "sarah.c@example.com",    meta: "by user · 1 device" },
  { ts: "14:25:17", level: "info",  evt: "app.created",     user: "admin@identite.ga",      meta: "bourses-min-edu · pending" },
]
