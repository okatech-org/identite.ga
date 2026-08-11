/**
 * Composants de la plateforme IDN exposés sur la page de transparence.
 *
 * ⚠️ Doctrine de communication publique — aucun taux de disponibilité, aucun
 * incident et aucune mesure ne figurent ici tant qu'ils ne sont pas produits
 * par une instrumentation réelle. Un chiffre de disponibilité inventé vaut
 * moins que son absence : il se retourne au premier audit contradictoire.
 * Voir ADMINISTRATION.GA, docs/00_Transverse/06_Communication_Publique.
 *
 * Quand l'instrumentation sera en place, c'est ici que la lecture temps réel
 * se branchera — en remplaçant ce module par une source de données, jamais en
 * y réintroduisant des constantes.
 */

export type PlatformComponent = {
  /** Nom du composant tel qu'exposé publiquement. */
  name: string;
  /** Ce que le composant fait — et, quand c'est décisif, où il s'exécute. */
  role: string;
};

export const PLATFORM_COMPONENTS: PlatformComponent[] = [
  {
    name: "Authentification (auth.identite.ga)",
    role: "Ouverture de session, passkeys, appareils et sessions actives, révocation.",
  },
  {
    name: "OpenID Connect / OAuth (oauth.identite.ga)",
    role: "Serveur d'identité aux standards : autorisation, jetons signés en RS256, point de publication des clés publiques, découverte automatique, gestion du consentement et de la déconnexion.",
  },
  {
    name: "API Identité (api.identite.ga)",
    role: "Interface normalisée de raccordement des administrations. Le niveau de garantie exigé est transmis dans la demande d'authentification et réellement appliqué.",
  },
  {
    name: "Vérification d'identité",
    role: "Lecture optique du document, lecture de la bande de lecture automatique du passeport selon la norme ICAO 9303, comparaison faciale et détection de présentation frauduleuse — modèles ouverts embarqués, aucune image ni gabarit transmis à un tiers.",
  },
  {
    name: "Entretien vidéo (niveau de garantie élevé)",
    role: "Prise de rendez-vous, salle chiffrée et décision humaine consignée par un contrôleur habilité. La machine propose, l'État dispose.",
  },
  {
    name: "Journal d'accès",
    role: "Journalisation en ajout seul : aucune fonction du système ne permet de modifier ni de supprimer une entrée. Plus de quarante types d'événements typés, chacun portant son auteur, son origine et son horodatage.",
  },
  {
    name: "Notifications",
    role: "Avis de sécurité et notification immédiate à la personne lorsque son identité est présentée à un contrôleur.",
  },
];
