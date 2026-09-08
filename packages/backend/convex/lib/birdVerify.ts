type BirdCreateResponse = {
  expires_at?: string
}

type BirdCheckResponse = {
  success?: boolean
  reason?: string | null
  attempts_remaining?: number
}

export type BirdCheckResult = {
  success: boolean
  reason: string | null
  attemptsRemaining: number | null
}

export class BirdVerifyError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message)
    this.name = "BirdVerifyError"
  }
}

/** Lance un envoi Verify en forçant le canal SMS. */
export async function sendBirdSmsCode(
  phone: string,
  requestId: string,
  purpose: "pin_recovery" | "phone_change" = "pin_recovery",
): Promise<{ expiresAt: number | null }> {
  const { apiKey, host } = birdConfiguration()
  const response = await fetch(`${host}/v1/verify/verifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `idn-${purpose.replace("_", "-")}-send-${requestId}`,
    },
    body: JSON.stringify({
      to: { phone_number: phone },
      options: { channels: ["sms"], code_length: 6 },
      metadata: { correlation_id: requestId, purpose },
    }),
  })

  if (!response.ok) {
    throw new BirdVerifyError("Bird a refusé l'envoi du code.", response.status)
  }

  const body = (await response.json()) as BirdCreateResponse
  const parsed = body.expires_at ? Date.parse(body.expires_at) : Number.NaN
  return { expiresAt: Number.isFinite(parsed) ? parsed : null }
}

/** Soumet le code saisi à Bird, qui possède seul sa valeur de référence. */
export async function checkBirdSmsCode(
  phone: string,
  code: string,
  idempotencyKey: string,
): Promise<BirdCheckResult> {
  const { apiKey, host } = birdConfiguration()
  const response = await fetch(`${host}/v1/verify/verifications/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      to: { phone_number: phone },
      code,
    }),
  })

  // Bird répond 404 quand une vérification a déjà atteint un état final.
  // Le client reçoit la même réponse qu'un code faux ou expiré.
  if (response.status === 404) {
    return { success: false, reason: "not_found", attemptsRemaining: null }
  }
  if (!response.ok) {
    throw new BirdVerifyError(
      "Bird n'a pas pu vérifier le code.",
      response.status,
    )
  }

  const body = (await response.json()) as BirdCheckResponse
  return {
    success: body.success === true,
    reason: typeof body.reason === "string" ? body.reason : null,
    attemptsRemaining:
      typeof body.attempts_remaining === "number"
        ? body.attempts_remaining
        : null,
  }
}

function birdConfiguration(): { apiKey: string; host: string } {
  const apiKey = process.env.BIRD_API_KEY?.trim()
  if (!apiKey) {
    throw new BirdVerifyError("BIRD_API_KEY n'est pas configurée.", null)
  }

  const region = apiKey.match(/^bk_(us1|eu1)_/)?.[1]
  if (!region) {
    throw new BirdVerifyError("La région de la clé Bird est invalide.", null)
  }
  return { apiKey, host: `https://${region}.platform.bird.com` }
}
