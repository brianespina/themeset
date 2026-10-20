"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AccountUser {
  username: string;
  avatarUrl: string | null;
}

export function AccountMenu({ user }: { user: AccountUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(pathname)}`}
        className="flex-none border border-border px-[14px] py-[11px] text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:border-border-hover hover:text-ink"
      >
        Sign in
      </Link>
    );
  }

  const initial = user.username.slice(0, 1).toUpperCase();

  return (
    <div className="relative flex-none" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        className="flex h-8 w-8 items-center justify-center overflow-hidden border border-border bg-surface-raised font-display text-[12px] text-ink-muted hover:border-acc"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[38px] z-50 w-[196px] border border-border bg-surface-raised py-1.5"
        >
          <div className="truncate border-b border-border px-3.5 pb-2.5 pt-1.5 text-[11.5px] text-ink-muted">
            {user.username}
          </div>
          <Link
            href="/my-sets"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] text-ink-muted hover:bg-surface-selected hover:text-ink"
          >
            Your sets
          </Link>
          {/* A form POST, not a link: a GET sign-out would let any third-party
              page log the user out with an <img> tag. */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-3.5 py-2.5 text-left text-[12px] text-ink-muted hover:bg-surface-selected hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
