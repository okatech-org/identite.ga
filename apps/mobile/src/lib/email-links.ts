export type EmailTextPart = {
  text: string
  url?: string
}

const LINK_PATTERN = /(?:https?:\/\/|mailto:|tel:|www\.)[^\s<>"']+/gi
const TRAILING_PUNCTUATION = /[),.;!?*]+$/

export function splitEmailTextLinks(text: string): EmailTextPart[] {
  const parts: EmailTextPart[] = []
  let cursor = 0

  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) parts.push({ text: text.slice(cursor, index) })

    const raw = match[0]
    const trailing = raw.match(TRAILING_PUNCTUATION)?.[0] ?? ""
    const label = trailing ? raw.slice(0, -trailing.length) : raw
    const url = label.toLowerCase().startsWith("www.")
      ? `https://${label}`
      : label

    parts.push({ text: label, url })
    if (trailing) parts.push({ text: trailing })
    cursor = index + raw.length
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts.length > 0 ? parts : [{ text }]
}
