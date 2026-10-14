import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SupportButton, Toaster, WishlistSync } from "@/components/layout/ClientChrome";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
    locale: "en_US",
    images: [{ url: "https://images.unsplash.com/photo-1608824405605-88c9d2c847e8?auto=format&fit=crop&w=1200&h=630&q=75", width: 1200, height: 630, alt: "Wrapped gifts beside a bouquet of fresh flowers" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#173F35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-clip bg-ivory font-sans text-ink">
        <a href="#main" className="sr-only z-[70] rounded-full bg-forest px-4 py-2 text-sm text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <div className="on-dark bg-forest-dark px-4 py-2 text-center text-xs tracking-[0.08em] text-ivory">
          {SITE.announcement}
        </div>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileMenu />
        <SearchOverlay />
        <CartDrawer />
        <Toaster />
        <SupportButton />
        <WishlistSync />
      </body>
    </html>
  );
}
