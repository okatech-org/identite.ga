# Serveur mail idn.ga

Le service de messagerie temporaire est hébergé par Stalwart dans la VM
`homelab` de la Freebox :

- IP publique : `82.66.163.161` ;
- IP privée de la VM : `192.168.1.39` ;
- nom public : `mail.idn.ga` ;
- image Stalwart : série stable `v0.16` ;
- répertoire de service : `/home/berny/services/mail` ;
- données : `/home/berny/services/mail/data`.

Le fichier `compose.freebox.yaml` expose directement SMTP, SMTPS et IMAPS.
Le conteneur Caddy existant du homelab termine HTTPS et transmet les requêtes
à Stalwart sur le réseau Docker `homelab_default`. Le bloc Caddy à conserver
dans la configuration du homelab se trouve dans `Caddyfile.freebox`.

Le conteneur `idn-mail-bridge` relie Stalwart à l'application :

- `POST /bridge/provision` crée idempotemment une vraie boîte Stalwart ;
- `POST /bridge/send` soumet un message authentifié à Stalwart ;
- le MTA Hook Stalwart appelle directement `/inbound` sur le réseau Docker ;
- le bridge transmet ensuite le message MIME normalisé à l'action HTTP Convex
  `/mail/inbound` ;
- les appels sont protégés par deux jetons distincts et les mots de passe des
  boîtes sont dérivés par HMAC, sans être stockés dans Convex.

Les secrets du bridge sont dans `/home/berny/services/mail/bridge.env` avec le
mode `0600`. Leurs copies d'exploitation sont dans le Trousseau macOS sous les
services `idn-ga-mail-bridge-token`, `idn-ga-mail-hook-token`,
`idn-ga-mail-inbound-token` et `idn-ga-mailbox-password-key` (compte
`idn-mail`).

L'administration est disponible sur `https://mail.idn.ga/admin`. Le mot de
passe du compte `admin@idn.ga` est conservé dans le Trousseau macOS, sous le
service `idn-ga-stalwart-admin` et le compte `admin@idn.ga`.

## Ports publics

La Freebox redirige les ports TCP suivants vers `192.168.1.39` :

- `25` : réception SMTP entre serveurs ;
- `80` et `443` : certificats ACME, administration, JMAP et autodécouverte ;
- `465` : soumission SMTP avec TLS implicite ;
- `993` : IMAP avec TLS implicite.

Les règles sont limitées à ces ports ; la DMZ Freebox n'est pas activée.

## DNS et délivrabilité

La zone NETIM contient un MX unique vers `mail.idn.ga`, dont l'enregistrement
A pointe vers `82.66.163.161`. Elle contient aussi SPF, deux signatures DKIM
(RSA et Ed25519), DMARC `reject`, MTA-STS, TLS-RPT et les alias de découverte
automatique.

Le trafic SMTP sortant direct sur TCP/25 est autorisé par l'accès Free et a été
testé vers plusieurs MX externes. Le reverse DNS Free est configuré sur
`mail.idn.ga`. Après un changement d'adresse, vérifier impérativement :

```sh
dig +short mail.idn.ga A
dig +short -x 82.66.163.161
```

Le compte `admin@idn.ga` reçoit également l'alias `postmaster@idn.ga`.

Le 8 août 2026, un test de production vers Mail Tester a obtenu `10/10` : SPF,
DKIM RSA, DKIM Ed25519, DMARC et reverse DNS valides.

## Exploitation

Depuis le réseau local :

```sh
ssh berny@192.168.1.39
cd /home/berny/services/mail
sudo docker compose -f compose.freebox.yaml ps
sudo docker logs --tail 100 stalwart
sudo docker logs --tail 100 idn-mail-bridge
```

Pour relancer le service :

```sh
sudo docker compose -f compose.freebox.yaml up -d
sudo docker exec caddy caddy reload \
  --config /etc/caddy/Caddyfile --adapter caddyfile
```

Après une évolution du bridge, reconstruire uniquement ce service :

```sh
sudo docker compose -f compose.freebox.yaml up -d --build bridge
```

Le hook MTA est un objet de configuration Stalwart nommé par son identifiant
JMAP. Il est exécuté au stage `data`, utilise une authentification Bearer et
conserve `tempFailOnError=true` : si Convex est indisponible, l'expéditeur
reçoit une erreur SMTP temporaire au lieu d'une fausse acceptation.

## Sauvegardes

Une sauvegarde de migration est conservée dans
`/home/berny/services/mail/backup`. Les données persistantes à sauvegarder sont
`data/stalwart`, `data/etc` et `bridge-data`. Cette installation temporaire ne
dispose pas encore d'une sauvegarde automatique hors site : il faut en ajouter
une avant d'en faire l'hébergement définitif.

## Ancienne infrastructure Google Cloud

L'ancienne infrastructure `mail-prod` a été supprimée le 8 août 2026 :
instance, disque, adresse IP statique, instantané, politique de sauvegarde,
règle pare-feu et secret Google Secret Manager. Il n'existe plus de repli
Google Cloud pour ce service.

## Vérifications après changement

Contrôler le DNS direct et inverse, le certificat TLS, les ports publics, les
enregistrements SPF/DKIM/DMARC, puis effectuer un test réel d'envoi et de
réception avec une adresse externe connue.
