"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/src/lib/auth";
import { fetchers } from "@/src/lib/fetchers";
import { appUrl } from "@/src/lib/base-path";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);
  const [settings, setSettings] = useState<{
    siteName?: string;
    logo?: string;
  } | null>(null);

  useEffect(() => {
    setRedirect(new URLSearchParams(window.location.search).get("redirect"));

    fetchers
      .publicSettings()
      .then((json) => setSettings(json?.data ?? null))
      .catch(() => setSettings(null));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await authApi.login({ email, password, rememberMe });

      if (!data.success) {
        setError(data.message || "Invalid credentials");
        return;
      }

      const role = data?.user?.role;

      if (redirect) {
        window.location.replace(redirect);
      } else if (role === "SUPER_ADMIN" || role === "ADMIN") {
        window.location.replace(appUrl("/admin"));
      } else {
        window.location.replace(appUrl("/dashboard"));
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Network error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {settings?.logo ? (
            <img
              src={settings.logo}
              alt={settings.siteName || "Site logo"}
              className="mx-auto mb-3 h-12 w-auto"
            />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">
              {settings?.siteName || "IPDAV"}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4"
        >
          {error && (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={loading}
            className="login-button flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            className="register-link"
            href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          >
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
