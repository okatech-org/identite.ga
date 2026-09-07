Verifie le depot. ⚠️ **Il n'y a aucun garde-fou automatique sur les PR ici** : la
verification locale est la seule qui existe avant le deploiement.

```bash
bun run check-types                      # next typegen && tsc --noEmit, sur tout
bun run lint                             # eslint --max-warnings 0
bun run --filter=@repo/backend test:once  # vitest + convex-test (edge-runtime)
```

Rapporte les **comptes reels** en sortie, jamais « ca devrait passer ».

## Ce qu'il faut savoir en lisant le resultat

- La suite du backend est **la seule reellement executee en CI**, et seulement a
  l'interieur du job de deploiement — pas sur les PR.
- Les quatre tests de `tests/` (runner **`bun:test`**) ne sont lances par rien :
  si j'ai touche a ce qu'ils couvrent, lance-les a la main (`bun test tests/`) et
  dis-le-moi.
- ⚠️ `bun test <chemin>` traite son argument comme un **filtre**, pas comme un
  chemin : verifie que la selection est bien celle que tu crois.
- Aucune tache `test` n'est declaree dans `turbo.json` : ne cherche pas
  `turbo run test`, il ne fera rien.

Si j'ai touche aux SDK publics, ajoute :
`bun run --filter=@idn-ga/better-auth test`.
