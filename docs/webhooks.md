# Webhooks IDN

Les webhooks sont rattachés aux applications OAuth du portail développeur. IDN ne contient aucune URL ni aucun secret propre à une application consommatrice.

## Enveloppe et signature

```json
{
  "id": "evt_...",
  "type": "iboite.account.updated",
  "apiVersion": "1",
  "createdAt": 1787395200000,
  "subject": "sub_idn",
  "data": {
    "accountVersion": 42,
    "counters": {
      "unreadLetters": 2,
      "pendingLetters": 1,
      "availablePackages": 0,
      "unreadMessages": 4
    }
  }
}
```

Chaque requête `POST` porte `X-IDN-Event-Id`, `X-IDN-Event-Type`, `X-IDN-Timestamp` et `X-IDN-Signature`. La signature vaut `v1=<hmac-sha256>` sur la chaîne `<timestamp>.<corps brut>`. Pendant les 24 heures suivant une rotation, l'en-tête contient les signatures du nouveau et de l'ancien secret, séparées par une virgule.

Le récepteur doit vérifier le corps brut, limiter l'écart d'horloge à cinq minutes, puis dédupliquer `X-IDN-Event-Id`. Un retour HTTP `2xx` confirme la livraison.

## Catalogue version 1

| Événement                       | Autorisation revérifiée avant chaque appel      |
| ------------------------------- | ----------------------------------------------- |
| `iboite.account.updated`        | consentement OAuth actif avec `idn:iboite.read` |
| `identity.verification.created` | clé M2M liée avec `idn:verification:list`       |
| `identity.verification.updated` | clé M2M liée avec `idn:verification:list`       |
| `identity.verification.deleted` | clé M2M liée avec `idn:verification:list`       |

Il n'existe pas d'abonnement `*`. Le webhook iBoîte ne contient ni corps, ni expéditeur, ni pièce jointe : l'application relit la façade `/api/oauth/iboite/v1`, qui reste la source de vérité.

## Exploitation

- Les endpoints de production utilisent HTTPS sur le port 443.
- L'activation et le bouton de test envoient un challenge signé ; le récepteur retourne `{ "challenge": "..." }`.
- Les tentatives ont lieu à 0, 1 minute, 5 minutes, 30 minutes, 2 heures, 6 heures, 12 heures et 24 heures après la création.
- `Retry-After` est respecté sur `429`, avec un plafond de 24 heures. `410` désactive l'endpoint. Vingt échecs consécutifs le mettent en pause.
- Les événements et journaux sont conservés 30 jours. Un rejeu manuel conserve le même identifiant d'événement.

Le backend Convex IDN exige une clé maître de 256 bits pour chiffrer les secrets :

```sh
openssl rand -hex 32
npx convex env set WEBHOOK_SECRETS_KEY <valeur-hexadécimale>
```

Le secret d'un endpoint est affiché une seule fois dans le portail. Il doit être stocké directement dans le gestionnaire de secrets de l'application consommatrice.

## Mise en service d'une application

1. Déclarer les scopes OAuth nécessaires dans la fiche de l'application. Pour une iBoîte complète : `idn:iboite.read`, `idn:iboite.manage`, `idn:iboite.send` et `offline_access`.
2. Créer l'endpoint HTTPS dans l'onglet **Webhooks**, sélectionner chaque événement voulu, puis copier immédiatement le secret affiché.
3. Configurer ce secret côté serveur du destinataire et lancer le challenge d'activation.
4. Faire consentir ou reconnecter les utilisateurs pour que les nouveaux scopes soient effectivement accordés. Un scope seulement déclaré sur l'application n'autorise aucune livraison personnelle.
5. Pour les événements de vérification, lier une clé M2M à la même application avec `idn:verification:list`.

Les applications qui déposent des accusés ou des courriers officiels utilisent une clé M2M liée portant `idn:iboite:letters:create`, l'en-tête `Idempotency-Key`, et `POST /api/partner/iboite/letters`. En sandbox, le destinataire doit faire partie des utilisateurs de test déclarés.

Pendant une rotation, installer le nouveau secret comme secret courant et conserver l'ancien avec la date `previousValidUntil` retournée par le portail. L'ancien doit être supprimé après cette échéance.
