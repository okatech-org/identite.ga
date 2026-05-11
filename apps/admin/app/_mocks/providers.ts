/**
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx:1586-1627
 * Verbatim.
 */

export type Provider = { id: string; name: string; desc: string }

export const EMAIL_PROVIDERS: Provider[] = [
  { id: "resend",    name: "Resend",      desc: "Provider par défaut MVP · 38.4k envois / mois" },
  { id: "sendgrid",  name: "SendGrid",    desc: "Twilio · clé API configurée" },
  { id: "aws-ses",   name: "AWS SES",     desc: "Région eu-west-3 · vérification DKIM ok" },
  { id: "smtp",      name: "SMTP custom", desc: "Pour relais on-premise gabonais" },
]

export const EMAIL_ACTIVE = "resend"

export const SMS_PROVIDERS: Provider[] = [
  { id: "twilio",          name: "Twilio",            desc: "Couverture mondiale · sandbox configuré" },
  { id: "vonage",          name: "Vonage",            desc: "Anciennement Nexmo" },
  { id: "africastalking",  name: "Africa's Talking",  desc: "Recommandé pour le Gabon · prix local" },
]
