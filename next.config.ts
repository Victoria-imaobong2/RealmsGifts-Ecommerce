import type { NextConfig } from "next";

// Safety net: NEXT_PUBLIC_* values are bundled into browser JavaScript. Refuse
// to build if a Paystack secret key was put in one by mistake.
for (const [name, value] of Object.entries(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && /^\s*sk_(live|test)_/.test(value ?? "")) {
    throw new Error(`${name} contains a Paystack SECRET key. Only the public key (pk_…) may use a NEXT_PUBLIC_ variable.`);
  }
}

const nextConfig: NextConfig = {
  images: {
    // Product photography is served from Unsplash's CDN, which resizes on the
    // fly. The custom loader requests correctly sized variants directly, so we
    // don't spend Vercel image-optimization quota on them.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  redirects() {
    return [
      { source: "/catalog", destination: "/shop", permanent: true },
      { source: "/profile", destination: "/account", permanent: true },
    ];
  },
  rewrites() {
    return [{ source: "/gifts-for-:recipient", destination: "/recipient/:recipient" }];
  },
};

export default nextConfig;
