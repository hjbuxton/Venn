import Link from "next/link";
import { VennLogo } from "@/components/VennMark";
import { SignOutButton } from "@/components/SignOutButton";

export function AppHeader({ userName }: { userName?: string }) {
  return (
    <header className="border-b border-line bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard">
          <VennLogo />
        </Link>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden sm:inline text-sm text-ink-3">
              Hi, <span className="font-semibold text-ink">{userName}</span>
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
