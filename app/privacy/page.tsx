import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1">
      <MarketingHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-8 sm:pt-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.05]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-ink-3">Last updated: 7 September 2026</p>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="rounded-2xl border border-line bg-white p-8 sm:p-10 space-y-8">
            <p className="text-sm text-ink-3 leading-relaxed">
              Venn (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates venntravel.co.uk. This
              policy explains what information we collect and how we use it.
            </p>

            <div>
              <h2 className="font-bold text-ink text-lg mb-2">What we collect</h2>
              <ul className="space-y-2 text-sm text-ink-3 leading-relaxed list-disc pl-5">
                <li>Your name and email address when you create an account.</li>
                <li>
                  Trip details you provide (dates, budget, preferences) when planning a trip.
                </li>
                <li>Messages you send within Venn&apos;s group chat feature.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-ink text-lg mb-2">How we use it</h2>
              <ul className="space-y-2 text-sm text-ink-3 leading-relaxed list-disc pl-5">
                <li>To create your account and let you use Venn.</li>
                <li>
                  To privately match your preferences against your group&apos;s preferences
                  using AI (Anthropic&apos;s Claude) to generate trip recommendations.
                </li>
                <li>
                  To send you essential account emails (sign-up confirmation, trip
                  notifications) via Resend.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-ink text-lg mb-2">Privacy between group members</h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                Your individual preferences (budget, dates, vibe) are never visible to other
                members of your trip. Only the combined AI-generated recommendations are shared
                with the group.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-ink text-lg mb-2">Third parties</h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                We use Supabase to store your data securely, Anthropic&apos;s Claude API to
                generate recommendations, and Resend to send emails. We do not sell your
                personal data to third parties. If you book accommodation through a
                Booking.com link on Venn, Booking.com&apos;s own privacy policy applies to that
                transaction.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-ink text-lg mb-2">Your rights</h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                You can request access to, correction of, or deletion of your data by
                contacting{" "}
                <a href="mailto:hello@venntravel.co.uk" className="text-brand hover:underline">
                  hello@venntravel.co.uk
                </a>
                . You can unsubscribe from notification emails at any time via the link in
                those emails.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-ink text-lg mb-2">Contact</h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                <a href="mailto:hello@venntravel.co.uk" className="text-brand hover:underline">
                  hello@venntravel.co.uk
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
