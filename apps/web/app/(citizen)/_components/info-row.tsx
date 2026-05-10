import { cn } from "@repo/ui/lib/utils"

type InfoRowProps = {
  label: string
  value: React.ReactNode
  mono?: boolean
  className?: string
}

export function InfoRow({ label, value, mono, className }: InfoRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-idn-border-soft py-3 last:border-b-0 sm:gap-6",
        className,
      )}
    >
      <span className="text-[13px] text-muted-foreground sm:text-[12px]">
        {label}
      </span>
      <span
        className={cn(
          "text-right text-[13px] font-medium text-foreground sm:text-left",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  )
}
