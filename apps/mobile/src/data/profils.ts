import type { OnboardingProfile } from '@/hooks/use-onboarding-state';

export type Profil = { id: OnboardingProfile; label: string; sub: string; loa: 1 | 2 | 3 };

export const PROFILS: Profil[] = [
  { id: 'citizen',   label: 'Citoyen gabonais',         sub: 'CNI + acte de naissance',           loa: 3 },
  { id: 'resident',  label: 'Résident étranger',        sub: 'Titre de séjour + passeport',       loa: 2 },
  { id: 'visitor',   label: 'Visiteur',                 sub: 'Passeport — accès limité',          loa: 1 },
  { id: 'developer', label: 'Développeur',              sub: 'Accès à l\'API IDN Connect',        loa: 2 },
];
