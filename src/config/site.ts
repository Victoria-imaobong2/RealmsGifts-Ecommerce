/**
 * Site-wide configuration. Values that differ per environment come from
 * NEXT_PUBLIC_* variables so they can be changed in Vercel without a code edit.
 */

export const SITE = {
  name: "Realmsgifts",
  tagline: "Thoughtful gifts. Wherever they are.",
  description:
    "Discover beautiful, meaningful gifts for birthdays, anniversaries, celebrations, and all the little moments that deserve something special.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "https://market-abroad.vercel.app").replace(/\/$/, ""),
  announcement: process.env.NEXT_PUBLIC_ANNOUNCEMENT || "Thoughtful gifts. Wherever they are.",
  /** Digits only, international format (e.g. 15551234567). Hidden when unset. */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  /** Shows a notice that listings are preview data. Turn off once the real catalogue is loaded. */
  sampleCatalog: process.env.NEXT_PUBLIC_SAMPLE_CATALOG !== "false",
  /** Only links that are configured are shown. */
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    pinterest: process.env.NEXT_PUBLIC_PINTEREST_URL || "",
  },
} as const;

export const MAIN_NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/occasions", label: "Occasions" },
  { href: "/gifts-for-her", label: "Gifts for Her" },
  { href: "/gifts-for-him", label: "Gifts for Him" },
  { href: "/track-order", label: "Track Order" },
  { href: "/about", label: "About" },
] as const;
