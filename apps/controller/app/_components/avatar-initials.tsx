import { cn } from "@repo/ui/lib/utils"

/**
 * Avatar circulaire avec dégradé vert IDN — utilisé dans la file et
 * sur la fiche identité scannée (idn-desktop.jsx:1936-1955, 2162-2177).
 */
export function AvatarInitials({
  initials,
  size = 38,
  rounded = "full",
  fontSize,
  className,
}: {
  initials: string
  size?: number
  /** "full" pour cercle, "lg" pour 14px radius (carte scan) */
  rounded?: "full" | "lg"
  fontSize?: number
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: fontSize ?? Math.round(size * 0.34),
      }}
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br from-idn-green to-idn-green-dark font-semibold text-white",
        rounded === "full" ? "rounded-full" : "rounded-[14px]",
        className,
      )}
    >
      {initials}
    </div>
  )
}
