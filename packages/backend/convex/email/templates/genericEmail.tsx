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

/**
 * Email générique — utilisé par `notifications.dispatch` quand `sendEmail`
 * est demandé sans template dédié. Reprend la charte des emails KYC :
 * conteneur centré, headline en haut, intro, body principal, footer signature.
 *
 * Le titre/intro/body sont fournis par l'appelant — pas de templating par
 * `kind`. Pour les notifs avec parcours dédié (KYC), on garde leur template
 * spécialisé (`kycEmail.tsx`).
 */

export function GenericEmail({
  title,
  body,
  recipientName,
}: {
  title: string
  body: string
  recipientName: string | null
}) {
  const greeting = recipientName ? `Bonjour ${recipientName},` : "Bonjour,"
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-xl bg-white p-8 shadow">
            <Heading className="m-0 text-xl font-bold text-slate-900">
              {title}
            </Heading>
            <Section className="mt-6 space-y-3 text-sm leading-relaxed text-slate-700">
              <Text className="m-0">{greeting}</Text>
              <Text className="m-0 whitespace-pre-line">{body}</Text>
            </Section>
            <Section className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <Text className="m-0">
                Vous recevez cet email parce que vous avez activé les
                notifications email pour cette catégorie sur Identite.ga.
                Vous pouvez ajuster vos préférences dans Paramètres &gt;
                Notifications.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
