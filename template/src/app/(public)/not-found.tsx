// app/not-found.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/src/lib/axios";

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export default function NotFound() {
  useEffect(() => {
    const pathname = window.location.pathname;
    console.log("🚨 404 page loaded for:", pathname);

    // Test if fetch works
    fetch(apiPath("/api/logs/404"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    })
      .then((res) => {
        console.log("📡 Response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("✅ 404 logged successfully:", data);
      })
      .catch((err) => {
        console.error("❌ Failed to log 404:", err);
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl mt-4">Page not found</p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
