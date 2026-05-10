import { cn } from "@repo/ui/lib/utils"

type PageHeroProps = {
  eyebrow: string
  title: string
  sub?: string
  className?: string
}

export function PageHero({ eyebrow, title, sub, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-[1180px] px-4 pb-7 pt-12 md:px-7 md:pt-15",
        className,
      )}
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-2.5 max-w-[820px] text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-[42px]">
        {title}
      </h1>
      {sub && (
        <p className="mt-3.5 max-w-[660px] text-base leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
    </section>
  )
}
