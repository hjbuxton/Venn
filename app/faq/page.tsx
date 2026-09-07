import { LinkButton } from "@/components/ui/Button";
import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { FaqAccordion } from "@/components/FaqAccordion";

const faqs = [
  {
    q: "Is Venn actually free?",
    a: "Yes. Creating a trip, inviting your group, and getting AI recommendations costs nothing. Venn earns a small commission if you book accommodation through our links — that's it.",
  },
  {
    q: "How does Venn keep our preferences private?",
    a: "Each person submits their own budget, dates, and vibe privately. Nobody in your group — including the organizer — can see anyone else's individual answers. Venn's AI only sees the combined picture when finding what works for everyone.",
  },
  {
    q: "What if my friends don't respond to the invite?",
    a: "You can still explore ideas with @Venn on your own while you wait — ask questions, get a feel for what's possible. Full group recommendations unlock once enough people have shared their preferences.",
  },
  {
    q: "How does the AI actually pick a destination?",
    a: "Venn uses Claude (by Anthropic) to find the overlap across everyone's budget, travel dates, and preferences, then surfaces real destinations and accommodation that fit — with direct booking links, not just generic suggestions.",
  },
  {
    q: "Do I need the whole group to sign up?",
    a: "Only the organizer needs an account to start. Everyone else just needs the invite link to submit their preferences.",
  },
  {
    q: "Is my personal data safe?",
    a: "Venn only uses your information to help plan your trip. We don't sell your data, and your individual preferences are never shown to other members of your group.",
  },
  {
    q: "Can I use Venn for any type of trip?",
    a: "Yes — bachelor/bachelorette parties, festivals, family trips, university friend groups, or any group holiday where getting everyone to agree has been the hard part.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col flex-1">
      <MarketingHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-8 sm:pt-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.05]">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-lg text-ink-3">
            Everything you need to know about planning a trip with Venn.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <FaqAccordion faqs={faqs} />
        </section>

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

      <MarketingFooter />
    </div>
  );
}
