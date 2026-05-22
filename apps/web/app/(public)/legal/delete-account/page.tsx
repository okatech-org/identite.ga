import { pageMetadata } from "../../../../lib/seo"
import { PageHero } from "../../_components/page-hero"
import { deleteAccount } from "../../_content/fr"

export const metadata = pageMetadata({
  title: deleteAccount.meta.title,
  description: deleteAccount.meta.description,
  path: "/legal/delete-account",
})

export default function DeleteAccountPage() {
  return (
    <>
      <PageHero
        eyebrow={deleteAccount.hero.eyebrow}
        title={deleteAccount.hero.title}
        sub={deleteAccount.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <div className="max-w-[760px] space-y-10">
          <div className="border-t border-border pt-6">
            <h2 className="text-[17px] font-semibold text-foreground">
              {deleteAccount.inAppTitle}
            </h2>
            <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-foreground/80">
              {deleteAccount.inAppSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="font-mono text-[11px] font-semibold text-idn-green dark:text-idn-green-on-dark">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-[17px] font-semibold text-foreground">
              {deleteAccount.byEmailTitle}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">
              {deleteAccount.byEmailBody}
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-[17px] font-semibold text-foreground">
              {deleteAccount.whatIsDeletedTitle}
            </h2>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-foreground/80">
              {deleteAccount.whatIsDeleted.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="font-mono text-idn-green dark:text-idn-green-on-dark">
                    —
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-[17px] font-semibold text-foreground">
              {deleteAccount.whatIsKeptTitle}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">
              {deleteAccount.whatIsKeptBody}
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-[17px] font-semibold text-foreground">
              {deleteAccount.contactTitle}
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">
              {deleteAccount.contactBody}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
