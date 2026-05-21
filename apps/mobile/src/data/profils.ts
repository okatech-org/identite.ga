import type { OnboardingProfile } from '@/hooks/use-onboarding-state';

export type Profil = { id: OnboardingProfile; label: string; sub: string; loa: 1 | 2 | 3 };

// Les développeurs s'inscrivent depuis la plateforme dédiée — pas exposé
// dans le tunnel mobile citoyen.
export const PROFILS: Profil[] = [
  { id: 'citizen',   label: 'Citoyen gabonais',         sub: 'CNI + acte de naissance',           loa: 3 },
  { id: 'resident',  label: 'Résident étranger',        sub: 'Titre de séjour + passeport',       loa: 2 },
  { id: 'visitor',   label: 'Visiteur',                 sub: 'Passeport — accès limité',          loa: 1 },
];
