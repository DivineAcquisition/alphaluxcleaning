import type { Metadata, Viewport } from "next";
import ChatWidget from "./ChatWidget";
import MarketingScripts from "./MarketingScripts";
import "@/index.css";

export const metadata: Metadata = {
  title: "Save 50% On Your First Cleaning | AlphaLux Cleaning",
  description:
    "New customers save 50% on their first AlphaLux Cleaning with code ALC2026. Premium residential & commercial cleaning in Long Island, NY and New Jersey — eco-friendly, insured, 5-star rated.",
  authors: [{ name: "AlphaLux Cleaning" }],
  icons: {
    icon: [
      { url: "/brand/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
    shortcut: "/brand/favicon.png",
  },
  openGraph: {
    type: "website",
    title: "Save 50% On Your First Cleaning | AlphaLux Cleaning",
    description:
      "New customers save 50% with code ALC2026 — premium cleaning in NY and NJ. A higher standard of clean.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/gKZdtAV5x1fAVy9ghNl5qNeLg112/social-images/social-1760931236601-Untitled design (2).png",
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@alphaluxclean",
    title: "Save 50% On Your First Cleaning | AlphaLux Cleaning",
    description:
      "New customers save 50% with code ALC2026 — premium cleaning in NY and NJ. A higher standard of clean.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/gKZdtAV5x1fAVy9ghNl5qNeLg112/social-images/social-1760931236601-Untitled design (2).png",
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B314B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        {/* Meta Pixel + Mouseflow — suppressed on the admin host. */}
        <MarketingScripts />

        {/* LeadConnector chat widget — public funnel host only. */}
        <ChatWidget />

        {children}
      </body>
    </html>
  );
}
