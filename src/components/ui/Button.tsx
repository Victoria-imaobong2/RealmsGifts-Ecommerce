import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-ivory shadow-sm hover:bg-forest-dark",
  secondary: "border border-ink/15 bg-white text-ink hover:border-forest hover:text-forest",
  ghost: "text-ink hover:bg-cream",
  light: "bg-ivory text-forest hover:bg-white",
  "outline-light": "border border-ivory/40 text-ivory hover:bg-ivory/10",
  danger: "border border-sale/30 bg-white text-sale hover:bg-sale/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-sm uppercase tracking-[0.12em]",
};

interface Shared {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<Shared, "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, ...props }: Shared & ComponentProps<"button">) {
  return <button type="button" className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: Shared & ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
