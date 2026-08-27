"use client";

import {
  generateFacebookPixelScript,
  generateGoogleAdsScript,
  generateGoogleAnalyticsScript,
  generateGtmHeadScript,
} from "@/src/app/lib/utils/analyticsScripts";
import { useEffect } from "react";
// import {
//   generateGtmHeadScript,
//   generateGoogleAnalyticsScript,
//   generateFacebookPixelScript,
//   generateGoogleAdsScript,
// } from "@/src/lib/utils/analyticsScripts";

export default function AnalyticsScripts({ analytics }: { analytics: any }) {
  useEffect(() => {
    if (!analytics) return;

    const injectScript = (
      id: string,
      customScript?: string,
      generatedScript?: string,
    ) => {
      const code = customScript?.trim() || generatedScript?.trim();

      if (!code) return;

      document.getElementById(id)?.remove();

      // Custom HTML snippet
      if (code.includes("<script")) {
        const wrapper = document.createElement("div");
        wrapper.id = id;
        wrapper.innerHTML = code;

        wrapper.querySelectorAll("script").forEach((oldScript) => {
          const newScript = document.createElement("script");

          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          newScript.textContent = oldScript.textContent;

          document.head.appendChild(newScript);
        });

        return;
      }

      // Generated JS
      const script = document.createElement("script");
      script.id = id;
      script.textContent = code;

      document.head.appendChild(script);
    };
    injectScript(
      "gtm-head",
      analytics.gtmHeadScript,
      analytics.gtmId ? generateGtmHeadScript(analytics.gtmId) : "",
    );

    injectScript(
      "ga-head",
      analytics.gaHeadScript,
      analytics.gaMeasurementId
        ? generateGoogleAnalyticsScript(analytics.gaMeasurementId)
        : "",
    );

    injectScript(
      "facebook-head",
      analytics.facebookHeadScript,
      analytics.facebookPixelId
        ? generateFacebookPixelScript(analytics.facebookPixelId)
        : "",
    );

    injectScript(
      "google-ads-head",
      analytics.googleAdsHeadScript,
      analytics.googleAdsId
        ? generateGoogleAdsScript(analytics.googleAdsId)
        : "",
    );

    return () => {
      document.getElementById("gtm-head")?.remove();
      document.getElementById("ga-head")?.remove();
      document.getElementById("facebook-head")?.remove();
      document.getElementById("google-ads-head")?.remove();
    };
  }, [analytics]);

  if (!analytics) return null;

  // GTM Body
  if (analytics.gtmBodyScript?.trim()) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: analytics.gtmBodyScript,
        }}
      />
    );
  }

  if (analytics.gtmId) {
    return (
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${analytics.gtmId}`}
          height="0"
          width="0"
          style={{
            display: "none",
            visibility: "hidden",
          }}
        />
      </noscript>
    );
  }

  return null;
}
