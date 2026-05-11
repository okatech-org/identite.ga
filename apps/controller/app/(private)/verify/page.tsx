import type { Metadata } from "next"

import { Button } from "@repo/ui/components/button"

import { CheckIcon } from "../../_components/icons"
import { IdnCard } from "../../_components/idn-card"
import { OpHeader } from "../../_components/op-header"
import { verify } from "../../_content/fr"

export const metadata: Metadata = { title: verify.meta.title }

/**
 * Vérifier signature — fidèle à `idn-desktop.jsx:2274-2357`.
 */
export default function VerifyPage() {
  return (
    <>
      <OpHeader sub={verify.sub} title={verify.title} />
      <div className="flex-1 overflow-auto p-7">
        <IdnCard className="max-w-[760px] p-6">
          <label
            htmlFor="verify-jwt"
            className="text-[13px] font-semibold text-idn-ink"
          >
            {verify.inputLabel}
          </label>
          <textarea
            id="verify-jwt"
            readOnly
            defaultValue={verify.jwt}
            className="mt-2.5 block h-[100px] w-full resize-none rounded-md border border-idn-border bg-idn-surface-2 p-3 font-mono text-[11px] text-idn-ink-2 outline-none focus-visible:border-idn-green focus-visible:ring-2 focus-visible:ring-idn-green/30"
          />
          <Button className="mt-3">{verify.submitCta}</Button>

          <div className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-idn-green-soft p-3.5 dark:bg-[#0F2A18]">
            <CheckIcon
              aria-hidden="true"
              className="mt-px size-4 shrink-0 text-idn-green dark:text-idn-green-on-dark"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-idn-ink">
                {verify.resultTitle}
              </div>
              <div className="mt-1 font-mono text-[11px] leading-[1.6] text-idn-muted">
                {verify.resultLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        </IdnCard>
      </div>
    </>
  )
}
