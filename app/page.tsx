import { LinkButton } from "@/components/ui/Button";
import { VennLogo, VennMark } from "@/components/VennMark";

const steps = [
  {
    title: "Everyone shares, privately",
    description:
      "Each person quietly adds their budget, free dates, and trip vibe. Nobody in the group can see anyone else's answers.",
  },
  {
    title: "Venn finds the overlap",
    description:
      "Our AI compares everyone's preferences and works out what actually works for the whole group — no awkward conversations needed.",
  },
  {
    title: "Book in one tap",
    description:
      "Get 5-10 curated trip ideas as cards in your group chat, each with a direct Booking.com link ready to go.",
  },
];

const faqs = [
  {
    q: "Can my friends see what I entered?",
    a: "Never. Your budget, dates, and preferences are completely private. Venn only shows the group the final overlap — the recommendations.",
  },
  {
    q: "What does Venn cost?",
    a: "Venn is free to use. We earn a small commission if you book through one of our Booking.com links — it doesn't cost you anything extra.",
  },
  {
    q: "Do all my friends need an account?",
    a: "Yes — each person signs up (it takes seconds) so their preferences stay private and they can join the group chat.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-line bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <VennLogo />
          <nav className="flex items-center gap-3">
            <LinkButton href="/login" variant="ghost" size="sm">
              Log in
            </LinkButton>
            <LinkButton href="/signup" size="sm">
              Sign up free
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-light text-brand text-xs font-semibold px-3 py-1.5 mb-6">
                Group travel, without the group chat chaos
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.05]">
                Your group&apos;s personal travel agent.
                <span className="text-brand"> Free.</span>
              </h1>
              <p className="mt-6 text-lg text-ink-3 max-w-lg">
                The hard part of a group trip was never finding somewhere to stay.
                It was agreeing on it. Venn collects everyone&apos;s budget and
                preferences privately, then finds the trip that works for all of you.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <LinkButton href="/signup" size="lg">
                  Start a trip
                </LinkButton>
                <LinkButton href="/login" variant="secondary" size="lg">
                  I have an invite link
                </LinkButton>
              </div>
            </div>

            <div className="relative h-[360px] sm:h-[420px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-52 h-52 sm:w-56 sm:h-56 rounded-full bg-brand/10 border border-brand/20" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-52 h-52 sm:w-56 sm:h-56 rounded-full bg-brand/20 border border-brand/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-2xl border border-line shadow-xl px-6 py-5 text-center max-w-[200px]">
                      <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">
                        Venn found it
                      </p>
                      <p className="text-base font-bold text-ink">Lisbon, Portugal</p>
                      <p className="text-sm text-ink-3 mt-1">4 nights · £340pp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white border-y border-line">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
                How Venn works
              </h2>
              <p className="mt-4 text-lg text-ink-3">
                Three simple steps from &quot;we should go away together&quot; to a booked trip.
              </p>
            </div>
            <div className="mt-12 grid sm:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-line p-6 bg-surface">
                  <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm mb-5">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-ink text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink-3 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy callout */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-ink text-white px-8 py-16 sm:px-16 text-center">
            <VennMark size={40} className="mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Nobody sees what you enter. Ever.
            </h2>
            <p className="mt-4 text-white/70 max-w-xl mx-auto text-lg">
              Your budget and preferences are yours alone. Venn only ever shows your
              group the trips that work for everyone — never who said what.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink mb-8 text-center">
            Questions, answered
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-line bg-white p-6">
                <h3 className="font-bold text-ink">{faq.q}</h3>
                <p className="mt-2 text-sm text-ink-3 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-3xl bg-brand text-white px-8 py-16 sm:px-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to plan your next trip away?
            </h2>
            <p className="mt-4 text-white/80 text-lg">
              Create a trip, invite your friends, and let Venn do the rest.
            </p>
            <div className="mt-8">
              <LinkButton href="/signup" variant="secondary" size="lg" className="!text-brand">
                Start a trip — it&apos;s free
              </LinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <VennLogo />
          <p className="text-sm text-ink-3">
            &copy; {new Date().getFullYear()} Venn. Group travel, sorted.
          </p>
        </div>
      </footer>
    </div>
  );
}
