import type { IconName } from '@/design/icons';
import type { MailAccount } from '@/data/mailbox';

/** Conversion du `iboiteAccount` (backend) vers le type UI `MailAccount`. */
export function iboiteAccountToUi(a: {
  _id: string;
  type: 'personal' | 'professional' | 'association';
  label: string;
  emailAlias: string;
  street: string;
  city: string;
  postalCode: string;
  country?: string;
  qrCode: string;
  isAddressConfigured?: boolean;
  district?: string | null;
  addressLine?: string | null;
}): MailAccount & { _id: string } {
  const grad = ((): [string, string] => {
    switch (a.type) {
      case 'personal':
        return ['#3b82f6', '#4338ca'];
      case 'professional':
        return ['#10b981', '#0d9488'];
      case 'association':
        return ['#a855f7', '#ec4899'];
    }
  })();
  const icon: IconName = a.type === 'personal' ? 'home' : a.type === 'professional' ? 'briefcase' : 'users';
  return {
    _id: a._id,
    id: a.type,
    label: a.label,
    icon,
    grad,
    email: a.emailAlias,
    addr: {
      rue: a.street,
      ville: a.city,
      bp: a.postalCode,
      qr: a.qrCode,
      district: a.district ?? undefined,
      addressLine: a.addressLine ?? undefined,
      country: a.country ?? undefined,
      isConfigured: a.isAddressConfigured === true,
    },
  };
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'À l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 2) return 'Hier';
  if (d < 7) return `Il y a ${d} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/**
 * Construit la première ligne d'adresse affichable. Priorité :
 *   1. quartier + ville
 *   2. ville seule
 *   3. addressLine
 *   4. null (= non configuré)
 */
export function formatAddressLine(addr: MailAccount['addr']): string | null {
  if (!addr.isConfigured) return null;
  const parts = [addr.district, addr.ville].filter((s): s is string => Boolean(s && s.trim()));
  if (parts.length > 0) return parts.join(', ');
  if (addr.addressLine && addr.addressLine.trim()) return addr.addressLine;
  if (addr.rue && addr.rue.trim()) return addr.rue;
  return null;
}
