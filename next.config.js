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
