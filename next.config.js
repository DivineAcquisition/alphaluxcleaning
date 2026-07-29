/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // We use a separate eslint pipeline; don't block builds on it.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // The existing SPA has permissive tsconfig; don't block builds on
    // non-Next type issues during the initial migration.
    ignoreBuildErrors: true,
  },
  images: {
    // Allow the branding logos referenced from alphaluxcleaning.com.
    remotePatterns: [
      { protocol: "https", hostname: "alphaluxcleaning.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async redirects() {
    return [
      // Host routing lives in middleware.ts (rule: src/config/domains.ts).
      // This entry stays as a backstop for the requests the middleware
      // matcher skips — asset-looking paths with a file extension.
      //
      // The legacy booking subdomain is retired — everything now lives on
      // try.alphaluxcleaning.com. Redirect at the edge (before React boots)
      // and preserve the path + query so ad links with ?promo=… survive.
      //
      // Stripe routing is unaffected: create-payment-intent resolves the
      // account from the customer's state/ZIP first (slugFromCustomerLocation),
      // so CA/TX customers still charge against the BOOK account even though
      // the host is no longer book.alphaluxclean.com.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?book\\.alphaluxclean\\.com" }],
        destination: "https://try.alphaluxcleaning.com/:path*",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": require("path").resolve(__dirname, "src"),
    };
    return config;
  },
};

module.exports = nextConfig;
