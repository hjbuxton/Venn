import { VennLogo } from "@/components/VennMark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <VennLogo />
        <p className="text-sm text-ink-3">
          &copy; {new Date().getFullYear()} Venn. Group travel, sorted.
        </p>
      </div>
    </footer>
  );
}
