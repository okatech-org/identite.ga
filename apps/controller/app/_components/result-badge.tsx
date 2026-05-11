import { history } from "../_content/fr"

/**
 * Badge VALIDE / EXPIRÉ pour l'historique (idn-desktop.jsx:2438-2455).
 */
export function ResultBadge({ result }: { result: "valide" | "expiré" }) {
  if (result === "valide") {
    return (
      <span className="rounded-full bg-idn-green-soft px-2.5 py-[3px] text-[11px] font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark">
        {history.resultValid}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-[#FBE5E5] px-2.5 py-[3px] text-[11px] font-semibold text-[#B83A3A] dark:bg-[#3A1E1E]">
      {history.resultExpired}
    </span>
  )
}
