import Link from "next/link";
import { VennLogo } from "@/components/VennMark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <VennLogo />
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-ink-3 hover:text-ink-2 transition-colors"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-ink-3 hover:text-ink-2 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-ink-3 hover:text-ink-2 transition-colors"
          >
            Terms of Service
          </Link>
        </nav>
        <p className="text-sm text-ink-3">
          &copy; {new Date().getFullYear()} Venn. Group travel, sorted.
        </p>
      </div>
    </footer>
  );
}
