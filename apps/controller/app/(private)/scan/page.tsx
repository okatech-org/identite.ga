import type { Metadata } from "next"

import { Button } from "@repo/ui/components/button"
import { LoABadge } from "@repo/ui/components/loa-badge"

import { AvatarInitials } from "../../_components/avatar-initials"
import { BellIcon, CheckIcon } from "../../_components/icons"
import { IdnCard } from "../../_components/idn-card"
import { OpHeader } from "../../_components/op-header"
import { scan } from "../../_content/fr"

export const metadata: Metadata = { title: scan.meta.title }

/**
 * Scanner identité — fidèle à `idn-desktop.jsx:2077-2272`.
 */
export default function ScanPage() {
  return (
    <>
      <OpHeader sub={scan.sub} title={scan.title} />
      <div className="grid flex-1 grid-cols-1 gap-[18px] p-7 lg:grid-cols-2">
        <IdnCard className="flex flex-col p-6">
          <div className="text-[13px] font-semibold text-idn-ink">
            {scan.reader.title}
          </div>
          <div className="mt-1 text-xs text-idn-muted">{scan.reader.sub}</div>
          <div className="relative mt-4 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-[10px] bg-[#1A1D17] dark:bg-[#0A0D0A]">
            <div
              aria-hidden="true"
              className="relative size-[200px] rounded-[12px] border-2 border-idn-green"
            >
              <div
                className="absolute left-0 right-0 h-0.5 bg-idn-green opacity-70"
                style={{
                  top: "50%",
                  boxShadow: "0 0 10px var(--idn-green)",
                  animation: "idn-scanline 2.4s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </IdnCard>

        <IdnCard className="p-6">
          <div className="text-[13px] font-semibold text-idn-ink">
            {scan.result.title}
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <AvatarInitials
              initials={scan.result.initials}
              size={56}
              fontSize={18}
              rounded="lg"
            />
            <div>
              <div className="text-[17px] font-semibold text-idn-ink">
                {scan.result.name}
              </div>
              <div className="mt-0.5 text-xs text-idn-muted">
                {scan.result.born}
              </div>
              <div className="mt-1.5">
                <LoABadge level={3} compact />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-idn-green-soft p-3 dark:bg-[#0F2A18]">
            <CheckIcon
              aria-hidden="true"
              className="mt-px size-4 shrink-0 text-idn-green dark:text-idn-green-on-dark"
            />
            <div>
              <div className="text-[13px] font-semibold text-idn-ink">
                {scan.result.signatureTitle}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-idn-muted">
                {scan.result.signatureMeta}
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
            {scan.result.docsLabel}
          </div>
          <div className="mt-2 space-y-1 text-[13px] leading-[1.7] text-idn-ink-2">
            {scan.result.docs.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-idn-yellow-soft p-3 text-xs text-idn-ink-2 dark:bg-[#1F2316]">
            <BellIcon
              aria-hidden="true"
              className="mt-px size-4 shrink-0 text-[#A7841C]"
            />
            <span>{scan.result.notice}</span>
          </div>

          <div className="mt-4 flex gap-2.5">
            <Button className="flex-1">{scan.result.validateCta}</Button>
            <Button variant="outline">{scan.result.cancelCta}</Button>
          </div>
        </IdnCard>
      </div>
    </>
  )
}
