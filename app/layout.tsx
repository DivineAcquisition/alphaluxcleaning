import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
  themeColor: "#0A0A0B",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        {/* Meta Pixel */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '795901793381387');
          fbq('track', 'PageView');`}
        </Script>

        {/* Mouseflow */}
        <Script id="mouseflow" strategy="afterInteractive">
          {`window._mfq = window._mfq || [];
          (function() {
            var mf = document.createElement("script");
            mf.type = "text/javascript"; mf.defer = true;
            mf.src = "//cdn.mouseflow.com/projects/04fea0d1-c0fa-44ee-98ba-6cf464d16d40.js";
            document.getElementsByTagName("head")[0].appendChild(mf);
          })();`}
        </Script>

        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=795901793381387&ev=PageView&noscript=1"
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}
