import Link from "next/link";
import { VennLogo } from "@/components/VennMark";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <VennLogo />
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink text-center">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-ink-3 text-center">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-3">{footer}</div>}
      </div>
    </div>
  );
}
