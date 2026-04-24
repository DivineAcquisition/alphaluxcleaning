"use client";

import dynamic from "next/dynamic";
import React from "react";

/**
 * The existing AlphaLux Cleaning booking experience is a React SPA built
 * with react-router-dom, Supabase, Stripe, etc. It must run client-only
 * inside the Next.js App Router shell, so we dynamic-import it with
 * ssr: false and render it here.
 */
const App = dynamic(() => import("@/App"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at center, hsl(212 47% 20%) 0%, hsl(214 56% 12%) 70%, hsl(220 62% 8%) 100%)",
        color: "#D7ECFA",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <style>
        {`@keyframes alxBootPulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50%      { transform: scale(1.04); opacity: 1; }
        }
        @keyframes alxBootRing {
          0%   { transform: rotate(0deg);   opacity: 0.6; }
          50%  { opacity: 1; }
          100% { transform: rotate(360deg); opacity: 0.6; }
        }`}
      </style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 132,
            height: 132,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.04)",
            boxShadow:
              "0 0 0 1px rgba(15, 119, 204, 0.30), 0 0 60px rgba(15, 119, 204, 0.35)",
            animation: "alxBootRing 2.4s linear infinite",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/alphalux-mark.png"
            alt="AlphaLux Clean"
            width={96}
            height={96}
            style={{
              width: 96,
              height: 96,
              borderRadius: "18px",
              objectFit: "cover",
              boxShadow: "0 8px 28px rgba(0, 0, 0, 0.35)",
              animation: "alxBootPulse 1.8s ease-in-out infinite",
            }}
          />
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(215, 236, 250, 0.92)",
          }}
        >
          Loading your booking experience…
        </p>
      </div>
    </div>
  ),
});

export default function ClientApp() {
  return <App />;
}
