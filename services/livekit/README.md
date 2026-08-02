# LiveKit — entretiens vidéo Niveau 3

Serveur LiveKit auto-hébergé pour le parcours Niveau 3 d'Identité.ga. Le MVP
met en relation un citoyen Niveau 2 et un Contrôleur d'Identité. Le contrôleur
réalise l'entretien en direct et prend manuellement la décision finale.

Les appels ne sont **pas enregistrés**. Aucun croisement avec l'état civil
n'est effectué dans cette version.

## Architecture

- VM Google Compute Engine `livekit-prod`, zone `europe-west1-b` ;
- Docker Compose en réseau hôte ;
- LiveKit Server `v1.13.5`, Redis local et Caddy L4 ;
- signalisation : `wss://video.identite.ga` ;
- TURN/TLS : `turn.identite.ga` ;
- secrets `livekit-api-key` et `livekit-api-secret` dans Secret Manager ;
- jetons de salle émis par Convex, limités à 15 minutes et à une seule salle.

LiveKit nécessite du réseau UDP direct : il ne doit pas être déployé sur Cloud
Run. La VM est une ressource persistante et facturée tant qu'elle existe.

## DNS

Les deux noms doivent pointer vers l'adresse statique régionale `livekit-ip` :

```text
video.identite.ga  A  <LIVEKIT_IP>
turn.identite.ga   A  <LIVEKIT_IP>
```

## Ports entrants

- `80/tcp` : émission initiale des certificats ;
- `443/tcp` : WSS et TURN/TLS ;
- `7881/tcp` : WebRTC sur TCP ;
- `3478/udp` : TURN/UDP ;
- `50000-60000/udp` : médias WebRTC.

## Déploiement

La VM, son IP et ses règles réseau sont provisionnées une seule fois comme
infrastructure GCP. Le workflow `.github/workflows/deploy-livekit.yml` est
ensuite l'unique chemin de déploiement : il injecte le script de démarrage,
redémarre la VM, puis synchronise les trois variables `LIVEKIT_*` avec le
déploiement Convex ciblé par `CONVEX_DEPLOY_KEY`.

Le compte de service de la VM (`livekit-runtime`) ne reçoit que
`roles/secretmanager.secretAccessor` sur les deux secrets LiveKit.
Le compte GitHub `livekit-deployer` reçoit un rôle personnalisé directement
sur la seule VM `livekit-prod`, jamais à l'échelle du projet.

Références :

- https://docs.livekit.io/transport/self-hosting/vm/
- https://docs.livekit.io/transport/self-hosting/ports-firewall/
