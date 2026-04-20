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
          "linear-gradient(135deg, hsl(240 4% 4%) 0%, hsl(25 22% 9%) 45%, hsl(30 16% 14%) 100%)",
        color: "#F6DFA8",
        fontFamily: "Georgia, serif",
        letterSpacing: "0.04em",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "14px",
            textTransform: "uppercase",
            color: "#A17938",
            letterSpacing: "0.2em",
            marginBottom: "8px",
          }}
        >
          AlphaLux Cleaning
        </div>
        <div style={{ fontSize: "20px", color: "#ECC98B" }}>
          Loading your booking experience…
        </div>
      </div>
    </div>
  ),
});

export default function ClientApp() {
  return <App />;
}
