import { queue as content } from "../../../_content/fr"

export type KycStatus = keyof typeof content.status

/**
 * Pastille de statut d'une demande. Le statut n'est plus implicite depuis
 * que la file couvre aussi l'historique : la couleur seule ne porte jamais
 * l'information, le libellé est toujours écrit (RGAA 3.1).
 */
const TONE: Record<KycStatus, string> = {
  pending: "bg-idn-surface-2 text-idn-muted",
  submitted: "bg-idn-surface-2 text-idn-muted",
  under_review: "bg-idn-blue-soft text-idn-blue",
  complement_required: "bg-[#FBF0D5] text-[#7A5200] dark:bg-[#3A2E14] dark:text-[#F2C94C]",
  approved: "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]",
  rejected: "bg-[#FBE5E5] text-[#B83A3A] dark:bg-[#3A1E1E]",
  expired: "bg-idn-surface-2 text-idn-muted",
}

export function StatusBadge({ status }: { status: KycStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.04em] ${TONE[status]}`}
    >
      {content.status[status]}
    </span>
  )
}
