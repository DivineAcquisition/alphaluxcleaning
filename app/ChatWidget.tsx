"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * LeadConnector (GoHighLevel) chat widget.
 *
 * Loads only on the public funnel host (try.alphaluxcleaning.com) so the
 * widget never appears in the admin workspace, the customer portal, the
 * contractor app, or on unrelated preview domains. Set
 * NEXT_PUBLIC_CHAT_WIDGET_HOSTS (comma-separated) to allow extra hosts
 * when testing on a preview URL.
 */

const WIDGET_ID = "6a6622cd7dc24a6d50911829";

const DEFAULT_HOSTS = ["try.alphaluxcleaning.com", "www.try.alphaluxcleaning.com"];

/** Route prefixes where the sales chat widget would be noise, not help. */
const EXCLUDED_PREFIXES = [
  "/admin",
  "/contractor",
  "/customer-portal",
  "/portal",
  "/dev",
  "/health",
];

function allowedHosts(): string[] {
  const extra = (process.env.NEXT_PUBLIC_CHAT_WIDGET_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_HOSTS, ...extra];
}

export default function ChatWidget() {
  const pathname = usePathname() || "/";
  const [hostAllowed, setHostAllowed] = useState(false);

  useEffect(() => {
    setHostAllowed(allowedHosts().includes(window.location.hostname.toLowerCase()));
  }, []);

  const routeAllowed = !EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!hostAllowed || !routeAllowed) return null;

  return (
    <Script
      id="leadconnector-chat-widget"
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id={WIDGET_ID}
      data-source="WEB_USER"
      strategy="afterInteractive"
    />
  );
}
