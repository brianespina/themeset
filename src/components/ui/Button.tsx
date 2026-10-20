import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "tertiary";

const base = "inline-flex items-center justify-center uppercase tracking-[0.16em] text-[11px] font-semibold transition-colors";

const variants: Record<Variant, string> = {
  primary: `${base} bg-ink text-bg px-5 py-3.5 hover:bg-white`,
  secondary: `${base} border border-border-strong text-ink px-5 py-3.5 hover:border-ink`,
  tertiary: `${base} border border-border text-ink-muted px-4 py-2.5 text-[11px] tracking-[0.14em] hover:border-border-hover hover:text-ink`,
};

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  href?: string;
}

export function Button({ variant = "primary", href, className = "", children, ...rest }: ButtonProps) {
  const cls = `${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
