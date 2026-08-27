"use client";

import Script from "next/script";

export default function TailwindRuntime() {
  return (
    <Script
      id="tailwind-runtime"
      src="https://cdn.tailwindcss.com"
      strategy="afterInteractive"
    />
  );
}