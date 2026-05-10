import Link from "next/link"

import { cn } from "@repo/ui/lib/utils"

import { footer, mobileFooter } from "../_content/fr"

export function MobilePublicFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-border bg-card", className)}>
      <div className="flex flex-col items-center gap-2 px-4 py-3 text-center">
        <span className="font-mono text-[11px] text-muted-foreground">
          {mobileFooter.copyright}
        </span>
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
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
      </div>
    </footer>
  )
}
