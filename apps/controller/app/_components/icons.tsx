import {
  BellIcon,
  CheckIcon,
  FileTextIcon,
  HomeIcon,
  QrCodeIcon,
  ShieldIcon,
  type LucideIcon,
} from "lucide-react"

/**
 * Icônes utilisées par la sidebar contrôleur, alignées sur les noms du
 * mockup `idn-desktop.jsx` (shield / qr / check / doc / bell) plus
 * `home` pour le tableau de bord ajouté par la décision d'arrivée.
 */
export const NavIcons: Record<
  "home" | "shield" | "qr" | "check" | "doc",
  LucideIcon
> = {
  home: HomeIcon,
  shield: ShieldIcon,
  qr: QrCodeIcon,
  check: CheckIcon,
  doc: FileTextIcon,
}

export { BellIcon, CheckIcon }
