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

type OtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email"

const SUBJECT: Record<OtpType, string> = {
  "sign-in": "Code de connexion à Identité Numérique",
  "email-verification": "Vérifiez votre adresse Identité Numérique",
  "forget-password": "Réinitialisation de votre mot de passe IDN",
  "change-email": "Confirmez votre nouvelle adresse email",
}

const HEADLINE: Record<OtpType, string> = {
  "sign-in": "Votre code de connexion",
  "email-verification": "Vérifiez votre adresse email",
  "forget-password": "Réinitialiser votre mot de passe",
  "change-email": "Nouvelle adresse email",
}

const INTRO: Record<OtpType, string> = {
  "sign-in":
    "Utilisez ce code à 6 chiffres pour vous connecter à votre compte IDN. Il est valable 15 minutes.",
  "email-verification":
    "Pour finaliser la création de votre compte Identité Numérique, saisissez ce code dans la page de vérification. Il est valable 15 minutes.",
  "forget-password":
    "Saisissez ce code à 6 chiffres pour choisir un nouveau mot de passe. Il est valable 15 minutes.",
  "change-email":
    "Saisissez ce code à 6 chiffres pour confirmer votre nouvelle adresse email. Il est valable 15 minutes.",
}

export function getOtpSubject(type: OtpType) {
  return SUBJECT[type]
}

type Props = {
  code: string
  type: OtpType
}

export function OtpEmail({ code, type }: Props) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{HEADLINE[type]} — code valable 15 minutes</Preview>
      <Tailwind>
        <Body className="bg-[#FAFAF8] font-sans">
          <Container className="mx-auto max-w-[480px] px-6 py-10">
            <Section className="mb-6 flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-[#0E7C3A]" />
              <Text className="m-0 text-sm font-semibold text-[#16170F]">
                Identité Numérique du Gabon
              </Text>
            </Section>

            <Heading className="m-0 text-2xl font-semibold text-[#16170F]">
              {HEADLINE[type]}
            </Heading>

            <Text className="mt-3 text-[15px] leading-relaxed text-[#3A3D2E]">
              {INTRO[type]}
            </Text>

            <Section className="my-7 rounded-xl border border-[#E6E4DD] bg-white py-6 text-center">
              <Text className="m-0 font-mono text-4xl font-semibold tracking-[0.4em] text-[#0E7C3A]">
                {code}
              </Text>
            </Section>

            <Text className="text-[13px] leading-relaxed text-[#74766B]">
              Si vous n'êtes pas à l'origine de cette demande, ignorez ce
              message. Personne ne pourra l'utiliser sans accès à votre boîte
              mail.
            </Text>

            <Text className="mt-6 text-[11px] leading-relaxed text-[#74766B]">
              République Gabonaise — Agence Nationale des Infrastructures
              Numériques
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export type { OtpType }
