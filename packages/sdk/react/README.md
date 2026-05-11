# @idn-ga/react

Provider et hooks React pour **Identité Numérique du Gabon (IDN)**. Construit au-dessus de [`@idn-ga/core`](https://www.npmjs.com/package/@idn-ga/core).

## Installation

```bash
bun add @idn-ga/react @idn-ga/core
# ou
npm install @idn-ga/react @idn-ga/core
```

## Usage

```tsx
import { IDNProvider, useIDN, useUser, SignedIn, SignedOut } from "@idn-ga/react"

export default function App() {
  return (
    <IDNProvider
      clientId="votre-client-id"
      redirectUri="https://votre-app.com/callback"
      issuer="https://identite.ga"
    >
      <Page />
    </IDNProvider>
  )
}

function Page() {
  const { signIn, signOut } = useIDN()
  const user = useUser()

  return (
    <>
      <SignedIn>Bonjour {user?.name} <button onClick={() => signOut()}>Déconnexion</button></SignedIn>
      <SignedOut><button onClick={() => signIn()}>Se connecter avec IDN</button></SignedOut>
    </>
  )
}
```

## API

- `<IDNProvider>` — wrappe votre app
- `useIDN()` — accès au client (`signIn`, `signOut`, `handleCallback`)
- `useUser()` / `useSession()` — état de la session
- `<SignedIn>` / `<SignedOut>` — rendu conditionnel
- `<IDNCallback>` — composant de page de callback prêt à l'emploi

## Peer dependencies

- `react` `^18 || ^19`

## Licence

MIT
