import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { VennLogo } from "@/components/VennMark";

export function MarketingHeader() {
  return (
    <header className="border-b border-line bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/">
          <VennLogo />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/faq"
            className="text-base font-medium text-ink-2 hover:text-ink transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/login"
            className="text-base font-medium text-ink-2 hover:text-ink transition-colors"
          >
            Log in
          </Link>
          <LinkButton href="/signup" size="sm">
            Sign up free
          </LinkButton>
        </nav>
      </div>
    </header>
  );
}
