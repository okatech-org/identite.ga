import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import * as React from "react"

export type KycEmailKind =
  | "complement_requested"
  | "approved"
  | "rejected"
  | "complement_provided"
  | "under_review"

const SUBJECT: Record<KycEmailKind, string> = {
  complement_requested: "Votre demande KYC nécessite un complément",
  approved: "Votre identité a été vérifiée (Niveau 2)",
  rejected: "Votre demande KYC a été refusée",
  complement_provided: "Un citoyen a fourni un complément KYC",
  under_review: "Votre demande KYC est en cours d'examen",
}

const HEADLINE: Record<KycEmailKind, string> = {
  complement_requested: "Le contrôleur demande un complément",
  approved: "Vérification réussie",
  rejected: "Demande refusée",
  complement_provided: "Nouveau complément reçu",
  under_review: "Dossier en cours d'examen",
}

const INTRO: Record<KycEmailKind, string> = {
  complement_requested:
    "Un contrôleur a examiné votre dossier KYC et a besoin d'un complément avant de pouvoir valider votre demande. Lisez le message ci-dessous, puis ré-uploadez la pièce concernée depuis votre espace IDN.",
  approved:
    "Votre identité a été vérifiée. Votre niveau de garantie a été élevé au Niveau 2 (substantiel) — plus de services administratifs sont maintenant accessibles depuis votre tableau de bord.",
  rejected:
    "Votre demande KYC n'a pas pu être validée. Vous trouverez ci-dessous le motif communiqué par le contrôleur. Vous pouvez démarrer une nouvelle demande à tout moment.",
  complement_provided:
    "Le citoyen a fourni le complément que vous aviez demandé. Sa demande est de retour dans votre file d'attente — vous pouvez reprendre l'examen.",
  under_review:
    "Les vérifications automatiques de votre dossier n'ont pas permis de conclure. Un agent va l'examiner manuellement. Aucune action n'est attendue de votre part : vous serez notifié dès qu'une décision sera prise.",
}

const CTA_LABEL: Record<KycEmailKind, string> = {
  complement_requested: "Voir ma demande",
  approved: "Accéder à mon tableau de bord",
  rejected: "Voir le détail",
  complement_provided: "Reprendre l'examen",
  under_review: "Suivre ma demande",
}

const CTA_URL: Record<KycEmailKind, string> = {
  complement_requested: "https://identite.ga/kyc/request",
  approved: "https://identite.ga/dashboard",
  rejected: "https://identite.ga/kyc/request",
  complement_provided: "https://controleur.identite.ga/queue",
  under_review: "https://identite.ga/kyc/request",
}

export function getKycEmailSubject(kind: KycEmailKind): string {
  return SUBJECT[kind]
}

type Props = {
  kind: KycEmailKind
  recipientName?: string | null
  /** Message du contrôleur (`complement_requested`) ou motif (`rejected`). */
  detail?: string | null
}

export function KycEmail({ kind, recipientName, detail }: Props) {
  const greeting = recipientName ? `Bonjour ${recipientName},` : "Bonjour,"

  return (
    <Html lang="fr">
      <Head />
      <Preview>{HEADLINE[kind]}</Preview>
      <Tailwind>
        <Body className="bg-[#FAFAF8] font-sans">
          <Container className="mx-auto max-w-[520px] px-6 py-10">
            <Section className="mb-6 flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-[#0E7C3A]" />
              <Text className="m-0 text-sm font-semibold text-[#16170F]">
                Identité Numérique du Gabon
              </Text>
            </Section>

            <Heading className="m-0 text-2xl font-semibold text-[#16170F]">
              {HEADLINE[kind]}
            </Heading>

            <Text className="mt-4 text-[15px] leading-relaxed text-[#3A3D2E]">
              {greeting}
            </Text>

            <Text className="mt-2 text-[15px] leading-relaxed text-[#3A3D2E]">
              {INTRO[kind]}
            </Text>

            {detail && (
              <Section className="my-6 rounded-xl border border-[#E6E4DD] bg-white px-5 py-4">
                <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#74766B]">
                  {kind === "rejected" ? "Motif du refus" : "Message du contrôleur"}
                </Text>
                <Text className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#16170F]">
                  {detail}
                </Text>
              </Section>
            )}

            <Section className="my-7 text-center">
              <a
                href={CTA_URL[kind]}
                className="inline-block rounded-md bg-[#0E7C3A] px-5 py-3 text-[14px] font-semibold text-white no-underline"
              >
                {CTA_LABEL[kind]}
              </a>
            </Section>

            <Text className="text-[13px] leading-relaxed text-[#74766B]">
              Vous recevez cet email parce que vous êtes inscrit·e sur Identité
              Numérique. Vous pouvez modifier vos préférences de notifications
              depuis vos paramètres.
            </Text>

            <Text className="mt-6 text-[11px] leading-relaxed text-[#74766B]">
              Ntsagui digital
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
