---
"@idn-ga/better-auth": patch
---

Force le helper Better Auth à charger le profil depuis `/userinfo` afin de
recevoir les claims civils IDN étendus, même lorsqu'un ID token est présent.
Le profil typé inclut désormais aussi le NIP, le sexe, le lieu de naissance et
l'environnement de l'application OIDC.
