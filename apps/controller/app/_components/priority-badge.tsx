import { queue } from "../_content/fr"

/**
 * Badge "PRIORITÉ HAUTE" — fond rouge soft, texte rouge sombre,
 * fidèle au mockup (idn-desktop.jsx:1972-1986).
 */
export function PriorityBadge() {
  return (
    <span className="rounded-full bg-[#FBE5E5] px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.04em] text-[#B83A3A] dark:bg-[#3A1E1E]">
      {queue.priorityHigh}
    </span>
  )
}
