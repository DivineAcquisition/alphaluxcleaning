"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { hostRole } from "@/config/domains";

/**
 * Meta Pixel + Mouseflow.
 *
 * Marketing and session-replay tags belong to the public funnel. Running
 * them in the admin workspace would record staff sessions (including
 * customer PII on the bookings and leads pages) and pollute conversion
 * data with internal traffic, so they are suppressed on the admin host.
 * Unknown hosts (localhost, previews) keep the previous behavior.
 */

const META_PIXEL_ID = "795901793381387";
const MOUSEFLOW_PROJECT = "04fea0d1-c0fa-44ee-98ba-6cf464d16d40";

export default function MarketingScripts() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hostRole(window.location.hostname) !== "admin");
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');`}
      </Script>

      <Script id="mouseflow" strategy="afterInteractive">
        {`window._mfq = window._mfq || [];
        (function() {
          var mf = document.createElement("script");
          mf.type = "text/javascript"; mf.defer = true;
          mf.src = "//cdn.mouseflow.com/projects/${MOUSEFLOW_PROJECT}.js";
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
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
