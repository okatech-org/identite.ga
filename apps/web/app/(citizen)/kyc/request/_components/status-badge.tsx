import { cn } from "@repo/ui/lib/utils"

const STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Brouillon",
    className:
      "bg-idn-surface-2 text-idn-muted dark:bg-idn-surface-2 dark:text-idn-muted",
  },
  submitted: {
    label: "Envoyée",
    className:
      "bg-idn-blue-soft text-idn-blue dark:bg-[#10243A] dark:text-idn-blue-on-dark",
  },
  under_review: {
    label: "En cours d'examen",
    className:
      "bg-idn-blue-soft text-idn-blue dark:bg-[#10243A] dark:text-idn-blue-on-dark",
  },
  complement_required: {
    label: "Complément demandé",
    className:
      "bg-idn-yellow-soft text-[#8a6a0a] dark:bg-[#1F2316] dark:text-[#E4C254]",
  },
  approved: {
    label: "Approuvée",
    className:
      "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark",
  },
  rejected: {
    label: "Refusée",
    className: "bg-[#FBE5E5] text-[#B83A3A] dark:bg-[#3A1E1E]",
  },
  expired: {
    label: "Expirée",
    className: "bg-[#FBE5E5] text-[#B83A3A] dark:bg-[#3A1E1E]",
  },
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-idn-surface-2 text-idn-muted",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )
}
