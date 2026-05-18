export type Slide = {
  tag: string;
  title: string;
  desc: string;
  art: 'idMark' | 'sovereign' | 'consent' | 'coverage';
};

export const ONBOARDING_SLIDES: Slide[] = [
  {
    tag: 'BIENVENUE',
    title: 'Un compte unique pour tous les services de l\'État.',
    desc: 'Authentifiez-vous une fois, accédez à 23 démarches administratives gabonaises.',
    art: 'idMark',
  },
  {
    tag: 'SOUVERAIN',
    title: 'Vos données restent au Gabon.',
    desc: 'Hébergement national, chiffrement de bout en bout, aucun transfert hors frontière.',
    art: 'sovereign',
  },
  {
    tag: 'CONSENTEMENT',
    title: 'Vous choisissez ce que vous partagez.',
    desc: 'Chaque service obtient votre accord pour les données strictement nécessaires.',
    art: 'consent',
  },
  {
    tag: 'INCLUSIF',
    title: 'Disponible partout au Gabon.',
    desc: 'App mobile, web, USSD *242# pour les zones non connectées, antennes dans les 9 provinces.',
    art: 'coverage',
  },
];
