import type { Metadata } from "next"

import { QrCodeIcon } from "lucide-react"

import { IdnCard } from "../../_components/idn-card"
import { OpHeader } from "../../_components/op-header"
import { scan } from "../../_content/fr"

export const metadata: Metadata = { title: scan.meta.title }

/**
 * Scanner identité — placeholder "à développer" en attendant
 * l'intégration WebRTC du lecteur QR/NFC et la vérification
 * côté serveur (action JWKS).
 */
export default function ScanPage() {
  return (
    <>
      <OpHeader sub={scan.sub} title={scan.title} />
      <div className="flex-1 overflow-auto p-7">
        <IdnCard className="mx-auto max-w-[640px] p-8">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full bg-idn-surface-2 text-idn-muted"
            >
              <QrCodeIcon className="size-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
                {scan.sub}
              </div>
              <div className="mt-1 text-[18px] font-semibold text-idn-ink">
                {scan.placeholderTitle}
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-idn-ink-2">
            {scan.placeholderBody}
          </p>
          <p className="mt-4 text-xs text-idn-muted">{scan.placeholderEta}</p>
        </IdnCard>
      </div>
    </>
  )
}
