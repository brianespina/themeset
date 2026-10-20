"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CatalogSource } from "@/lib/catalog";
import { AccountMenu, type AccountUser } from "@/components/auth/AccountMenu";

const NAV = [
  { label: "Explore", href: "/explore" },
  { label: "Build", href: "/build" },
  { label: "Combos", href: "/combos" },
  { label: "Skins", href: "/skins" },
  { label: "Community", href: "/community" },
];

const SOURCE_LABEL: Record<CatalogSource, string> = {
  steamanalyst: "Live · SteamAnalyst",
  public: "Community catalog",
  offline: "Offline",
};

const SOURCE_DOT: Record<CatalogSource, string> = {
  steamanalyst: "#3FBF86",
  public: "#D9AE43",
  offline: "#8C2028",
};

export function Header({
  catalogSource,
  catalogNote,
  user,
}: {
  catalogSource: CatalogSource;
  catalogNote: string;
  user: AccountUser | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-[14px] bg-[rgba(11,11,13,.86)]">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center gap-[26px] px-12 min-w-0">
        <Link href="/" className="flex-none pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-light.png" alt="ThemeSet" style={{ height: 10, width: "auto" }} />
        </Link>

        <nav className="flex-none flex gap-5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap py-1.5 text-[11px] uppercase tracking-[0.13em] border-b ${
                  active ? "text-ink border-acc" : "text-ink-muted border-transparent hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 min-w-0 items-center justify-end gap-2.5">
          <div className="flex min-w-[34px] flex-[0_1_236px] items-center gap-2 overflow-hidden border border-border bg-surface px-3 py-2.5 hover:border-border-strong">
            <svg width="13" height="13" viewBox="0 0 20 20" className="flex-none" stroke="#5E5E68" strokeWidth="1.6" fill="none">
              <circle cx="7" cy="7" r="4.6" />
              <line x1="10.6" y1="10.6" x2="14" y2="14" />
            </svg>
            <input
              type="text"
              placeholder="Search skins, sets, combos"
              className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-dim"
            />
          </div>

          <div
            className="flex min-w-[6px] flex-[0_1_auto] items-center gap-1.5 overflow-hidden"
            title={catalogNote}
          >
            <span
              className="h-1.5 w-1.5 flex-none rounded-full"
              style={{ background: SOURCE_DOT[catalogSource] }}
            />
            <span className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-dim">
              {SOURCE_LABEL[catalogSource]}
            </span>
          </div>

          <Link
            href="/build"
            className="flex-none bg-ink px-[18px] py-[11px] text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
          >
            Create
          </Link>

          <AccountMenu user={user} />
        </div>
      </div>
    </header>
  );
}
