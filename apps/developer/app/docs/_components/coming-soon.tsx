import Link from "next/link";

import { Callout, H1, Lede, P } from "./prose";
import { DocBody } from "./doc-body";

export function ComingSoon({
  title,
  breadcrumbs,
  description,
}: {
  title: string;
  breadcrumbs: string[];
  description: string;
}) {
  return (
    <DocBody breadcrumbs={breadcrumbs}>
      <H1>{title}</H1>
      <Lede>{description}</Lede>
      <Callout kind="info" title="En cours de développement">
        Cette section sera disponible dans une prochaine version du SDK. En
        attendant, retournez à la{" "}
        <Link
          href="/docs"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          page d&apos;accueil
        </Link>{" "}
        pour explorer ce qui est déjà documenté.
      </Callout>
      <P>
        Vous souhaitez être notifié à la sortie ? Suivez l&apos;équipe IDN sur{" "}
        <a
          href="https://github.com/okatech-org/identite.ga.git"
          className="text-idn-green underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
        </a>{" "}
        ou abonnez-vous au changelog depuis votre{" "}
        <Link
          href="/applications"
          className="text-idn-green underline-offset-2 hover:underline"
        >
          console développeur
        </Link>
        .
      </P>
    </DocBody>
  );
}
