"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { chatWidgetAllowed, pathSurface } from "@/config/domains";

/**
 * LeadConnector (GoHighLevel) chat widget.
 *
 * Public booking funnel only — the host/path rule comes from the shared
 * domain config, so the widget can never appear in the admin workspace
 * or on internal tooling pages. Set NEXT_PUBLIC_CHAT_WIDGET_HOSTS
 * (comma-separated) to allow extra hosts when testing on a preview URL.
 */

const WIDGET_ID = "6a6622cd7dc24a6d50911829";

function extraAllowedHosts(): string[] {
  return (process.env.NEXT_PUBLIC_CHAT_WIDGET_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export default function ChatWidget() {
  const pathname = usePathname() || "/";
  const [hostAllowed, setHostAllowed] = useState(false);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    // A preview host opted in via env still only gets the widget on
    // customer-facing routes.
    const previewAllowed =
      extraAllowedHosts().includes(host) && pathSurface(pathname) === "public";
    setHostAllowed(chatWidgetAllowed(host, pathname) || previewAllowed);
  }, [pathname]);

  if (!hostAllowed) return null;

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
