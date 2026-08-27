// components/subscription/welcome-popup.tsx
"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBaseUrl } from "@/src/lib/config";

interface WelcomePopupProps {
  show: boolean;
  onTrialStarted: () => void;
}

export function WelcomePopup({ show, onTrialStarted }: WelcomePopupProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  async function handleStartTrial() {
    setLoading(true);
    try {
      const res = await fetch(
        `${getBaseUrl()}/api/subscription/start-default-trial`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.success) {
        setDismissed(true);
        onTrialStarted();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 border border-gray-200 relative">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Welcome! How would you like to start?
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Try everything free for 14 days, or pick a plan now.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Starting trial..." : "Start 14-day free trial"}
          </button>
          <button
            onClick={() => router.push("/subscription/plans")}
            className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition"
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}
