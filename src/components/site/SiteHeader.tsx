/**
 * Top bar for every non-workspace page. The workspace has its own chrome.
 */
import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { AccountMenu } from "./AccountMenu";

export { Wordmark };

const LINKS = [
  { href: "/home", label: "Learn" },
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-4 sm:px-8">
      <Link href="/" aria-label="FORMA home" className="text-ink">
        <Wordmark />
      </Link>
      <nav aria-label="Site" className="flex items-center gap-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={current === l.href ? "page" : undefined}
            className={`rounded-[8px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
              current === l.href ? "bg-ink text-surface" : "text-ink-2 hover:bg-ground-deep hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <span className="ml-2"><AccountMenu /></span>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-[1120px] border-t border-line px-5 py-6 text-[12px] text-ink-3 sm:px-8">
      FORMA is free to use. Models are stylised teaching models, not clinical or engineering references.
    </footer>
  );
}
