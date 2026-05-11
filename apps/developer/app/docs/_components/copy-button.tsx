"use client"

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          void navigator.clipboard.writeText(text)
        }
      }}
      className="font-mono text-[11px] text-[#6B7565] outline-none hover:text-[#A8B4A2] focus-visible:text-[#A8B4A2]"
    >
      copier
    </button>
  )
}
