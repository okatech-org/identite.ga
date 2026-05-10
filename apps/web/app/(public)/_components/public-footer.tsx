import Link from "next/link"

import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { ThemeToggle } from "@repo/ui/components/theme-toggle"

import { footer } from "../_content/fr"

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:gap-6 md:px-7 md:py-4">
        <div className="flex items-center gap-3">
          <IdnFlagBars width={24} height={3} />
          <span className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            {footer.copyright}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-between gap-4 md:justify-end">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            {footer.links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}
