import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1">
      <MarketingHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-8 sm:pt-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.05]">
            About Venn
          </h1>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="rounded-2xl border border-line bg-white p-8 sm:p-10 space-y-6">
            <p className="text-sm text-ink-3 leading-relaxed">
              Hi — I&apos;m the person behind Venn.
            </p>
            <p className="text-sm text-ink-3 leading-relaxed">
              Every group trip I&apos;ve ever planned went the same way: someone suggests a
              destination, someone else goes quiet because it&apos;s out of budget but
              doesn&apos;t want to say so, and the group chat drags on for weeks without anyone
              actually deciding anything.
            </p>
            <p className="text-sm text-ink-3 leading-relaxed">
              Venn exists to fix that. Everyone shares their budget and preferences privately —
              nobody has to be the one who says no, or admits they can&apos;t afford what
              everyone else wants. An AI finds what actually works for the whole group, and you
              get real destinations and places to stay, not just another opinion to argue about.
            </p>
            <p className="text-sm text-ink-3 leading-relaxed">
              I&apos;m building Venn as an independent project, and I&apos;m still adding to it
              based on what actually helps people plan real trips. If you&apos;ve got feedback,
              I&apos;d genuinely like to hear it.
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
