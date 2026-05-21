import type { IconName } from '@/design/icons';

export type MailAccount = {
  id: 'personal' | 'professional' | 'association';
  label: string;
  icon: IconName;
  grad: [string, string];
  addr: {
    rue: string;
    ville: string;
    bp: string;
    qr: string;
    /** Quartier (ex. Akanda, Glass, Nzeng-Ayong). Vide tant que non configuré. */
    district?: string;
    /** Ligne d'adresse formatée (résolue par geocoder ou saisie manuelle). */
    addressLine?: string;
    /** Pays — par défaut Gabon. */
    country?: string;
    /** `true` une fois l'adresse configurée par le citoyen (GPS ou manuel). */
    isConfigured: boolean;
  };
  email: string;
};

export const MAIL_ACCOUNTS: MailAccount[] = [
  {
    id: 'personal',
    label: 'Personnel',
    icon: 'home',
    grad: ['#3b82f6', '#4338ca'],
    addr: { rue: 'Avenue du Colonel Parant', ville: 'Libreville', bp: 'BP 1000', qr: 'IDNGA-12345', isConfigured: true },
    email: 'jean.dupont@idn.ga',
  },
  {
    id: 'professional',
    label: 'Professionnel',
    icon: 'briefcase',
    grad: ['#10b981', '#0d9488'],
    addr: { rue: 'Boulevard Triomphal', ville: 'Libreville', bp: 'BP 5000', qr: 'IDNGA-PRO-5000', isConfigured: true },
    email: 'contact@abc-sarl.ga',
  },
  {
    id: 'association',
    label: 'Association',
    icon: 'users',
    grad: ['#a855f7', '#ec4899'],
    addr: { rue: 'Rue de la Solidarité', ville: 'Libreville', bp: 'BP 2500', qr: 'IDNGA-ASSO-2500', isConfigured: true },
    email: 'asso.jeunesse@idn.ga',
  },
];

export type Letter = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  type: 'action_required' | 'informational' | 'standard';
  read: boolean;
  due?: string;
};

export const MOCK_LETTERS: Letter[] = [
  { id: 'L1', sender: 'Mairie de Libreville', subject: 'Complément de dossier requis', preview: "Suite à l'examen de votre dossier de demande d'acte de naissance…", time: 'Il y a 2 h', type: 'action_required', read: false, due: '15 j' },
  { id: 'L2', sender: 'CNAMGS',               subject: "Confirmation d'adhésion à l'assurance maladie", preview: "Nous accusons réception de votre dossier d'adhésion CNAMGS…", time: 'Hier', type: 'informational', read: true },
  { id: 'L3', sender: 'DGDI',                 subject: 'Convocation renouvellement CNI', preview: 'Veuillez vous présenter au centre d\'enregistrement DGDI…', time: 'Lun.', type: 'standard', read: false },
];

export type Package = {
  id: string;
  tracking: string;
  sender: string;
  description: string;
  status: 'available' | 'transit';
  eta?: string;
};

export const MOCK_PACKAGES: Package[] = [
  { id: 'P1', tracking: 'GA2024-78901', sender: 'Amazon.fr', description: 'Commande électronique', status: 'available' },
  { id: 'P2', tracking: 'GA2024-78902', sender: 'La Poste',  description: 'Recommandé',            status: 'transit', eta: '17 mai' },
];

export type Email = {
  id: string;
  sender: { name: string; email: string; type: 'admin' | 'citizen' };
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  attach?: boolean;
};

export const MOCK_EMAILS: Email[] = [
  { id: 'E1', sender: { name: 'Mairie de Libreville', email: 'etat-civil@libreville.ga', type: 'admin' },   subject: 'Confirmation de votre demande',  preview: 'Votre demande a été enregistrée sous le numéro #2024-12345…', time: '09:32', read: false, starred: true,  attach: false },
  { id: 'E2', sender: { name: 'CNAMGS',                email: 'no-reply@cnamgs.ga',       type: 'admin' },   subject: 'Documents requis pour votre dossier', preview: 'Pour compléter votre dossier, merci de fournir…',        time: '08:14', read: false, starred: false, attach: true },
  { id: 'E3', sender: { name: 'DGI',                   email: 'fiscal@dgi.ga',            type: 'admin' },   subject: 'Rappel : Déclaration fiscale 2025',   preview: 'Nous vous rappelons que la date limite de déclaration…', time: 'Hier',  read: true,  starred: false },
  { id: 'E4', sender: { name: 'Jean Dupont',           email: 'jean.dupont@idn.ga',       type: 'citizen' }, subject: 'Re: Documents requis',                preview: 'Veuillez trouver ci-joint les documents demandés…',     time: '12 mai',read: true,  starred: false, attach: true },
];
