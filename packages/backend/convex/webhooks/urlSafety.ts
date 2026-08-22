export type WebhookEnvironment = "sandbox" | "production"

export type WebhookUrlResult =
  | { ok: true; url: string }
  | { ok: false; code: string; message: string }

function parseIpv4(value: string): number[] | null {
  const parts = value.split(".")
  if (parts.length !== 4) return null
  const octets = parts.map((part) => Number(part))
  if (
    octets.some(
      (octet, index) =>
        !Number.isInteger(octet) ||
        octet < 0 ||
        octet > 255 ||
        String(octet) !== parts[index],
    )
  ) {
    return null
  }
  return octets
}

function parseIpv6(value: string): number[] | null {
  const address = value.replace(/^\[|\]$/g, "").split("%", 1)[0]!
  if (!address.includes(":")) return null
  if (address.indexOf("::") !== address.lastIndexOf("::")) return null

  const expand = (raw: string): number[] | null => {
    if (!raw) return []
    const parts = raw.split(":")
    const out: number[] = []
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]!
      if (part.includes(".")) {
        if (index !== parts.length - 1) return null
        const ipv4 = parseIpv4(part)
        if (!ipv4) return null
        out.push((ipv4[0]! << 8) | ipv4[1]!, (ipv4[2]! << 8) | ipv4[3]!)
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(part)) return null
        out.push(Number.parseInt(part, 16))
      }
    }
    return out
  }

  const hasCompression = address.includes("::")
  const [leftRaw, rightRaw = ""] = address.split("::")
  const left = expand(leftRaw ?? "")
  const right = expand(rightRaw)
  if (!left || !right) return null
  if (!hasCompression) return left.length === 8 ? left : null
  const omitted = 8 - left.length - right.length
  if (omitted < 1) return null
  return [...left, ...Array<number>(omitted).fill(0), ...right]
}

export function isForbiddenIp(rawAddress: string): boolean {
  const address = rawAddress.toLowerCase().replace(/^\[|\]$/g, "")
  const ipv4 = parseIpv4(address)
  if (ipv4) {
    const a = ipv4[0]!
    const b = ipv4[1]!
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }

  const ipv6 = parseIpv6(address)
  if (!ipv6) return false
  const [a, b, c, d, e, f, g, h] = ipv6
  const firstSixAreZero = [a, b, c, d, e, f].every((word) => word === 0)
  const embeddedIpv4 = `${g! >> 8}.${g! & 255}.${h! >> 8}.${h! & 255}`
  if (firstSixAreZero) return true // non spécifié, loopback et IPv4 compatible
  if ([a, b, c, d, e].every((word) => word === 0) && f === 0xffff) {
    return isForbiddenIp(embeddedIpv4)
  }
  if ((a! & 0xfe00) === 0xfc00) return true // unique-local fc00::/7
  if ((a! & 0xffc0) === 0xfe80 || (a! & 0xffc0) === 0xfec0) return true
  if ((a! & 0xff00) === 0xff00) return true // multicast
  if (a === 0x0100 && b === 0 && c === 0 && d === 0) return true // discard-only
  if (a === 0x2001 && b! <= 0x01ff) return true // espace IPv6 spécial
  if (a === 0x2001 && b === 0x0db8) return true // documentation
  if (a === 0x2002) return true // 6to4 peut encapsuler une IPv4 privée
  if (a === 0x0064 && b === 0xff9b) return true // traduction IPv4/IPv6
  return false
}

export function validateWebhookUrl(
  input: string,
  _environment: WebhookEnvironment,
): WebhookUrlResult {
  let parsed: URL
  try {
    parsed = new URL(input.trim())
  } catch {
    return { ok: false, code: "INVALID_URL", message: "URL invalide." }
  }
  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      code: "HTTPS_REQUIRED",
      message: "Un endpoint webhook doit utiliser HTTPS.",
    }
  }
  if (parsed.port && parsed.port !== "443") {
    return {
      ok: false,
      code: "PORT_FORBIDDEN",
      message: "Seul le port HTTPS 443 est autorisé.",
    }
  }
  if (parsed.username || parsed.password || parsed.hash) {
    return {
      ok: false,
      code: "URL_FORBIDDEN",
      message: "L'URL ne doit contenir ni identifiants ni fragment.",
    }
  }
  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isForbiddenIp(hostname)
  ) {
    return {
      ok: false,
      code: "HOST_FORBIDDEN",
      message: "Cette adresse réseau n'est pas autorisée.",
    }
  }
  parsed.hash = ""
  return { ok: true, url: parsed.toString() }
}
