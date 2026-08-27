"use client";

import { useState, useEffect } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import {
  User,
  Key,
  Copy,
  Trash2,
  Plus,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Mail,
} from "lucide-react";
import { ROLE_COLORS, ROLE_LABELS } from "@/src/app/lib/permissions";

type RoleName = keyof typeof ROLE_LABELS;

interface AppPassword {
  id: number;
  name: string;
  lastUsed: string | null;
  createdAt: string;
  preview: string; // last 4 chars shown
}

// ── Section Card ──────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Main ProfileSection ───────────────────────────────────

export function ProfileSection() {
  const { user, refresh } = useCurrentUser();

  // Profile state
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // App passwords state
  const [appPasswords, setAppPasswords] = useState<AppPassword[]>([]);
  const [loadingAppPasswords, setLoadingAppPasswords] = useState(true);
  const [newAppPassName, setNewAppPassName] = useState("");
  const [generatingAppPass, setGeneratingAppPass] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [deletingAppPassId, setDeletingAppPassId] = useState<number | null>(
    null,
  );
  const [appPassError, setAppPassError] = useState("");

  // Load profile
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? user.email?.split("@")[0] ?? "",
        email: user.email ?? "",
      });
    }
  }, [user]);

  // Load app passwords
  useEffect(() => {
    fetchAppPasswords();
  }, []);

  async function fetchAppPasswords() {
    try {
      setLoadingAppPasswords(true);
      const res = await fetch(`${getBaseUrl()}/api/users/me/app-passwords`);
      const data = await res.json();
      setAppPasswords(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingAppPasswords(false);
    }
  }

  // ── Save Profile ──────────────────────────────────────

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.message || "Failed to save");
        return;
      }
      await refresh();
      setProfileSuccess("Profile updated successfully");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch {
      setProfileError("Network error");
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Change Password ───────────────────────────────────

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || "Failed to update password");
        return;
      }
      setNewPassword("");
      setPasswordSuccess("Password updated successfully");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch {
      setPasswordError("Network error");
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Generate App Password ─────────────────────────────

  async function handleGenerateAppPassword() {
    if (!newAppPassName.trim()) {
      setAppPassError("Please enter a name for this password");
      return;
    }
    setGeneratingAppPass(true);
    setAppPassError("");
    setGeneratedPassword(null);
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/me/app-passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAppPassName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppPassError(data.message || "Failed to generate");
        return;
      }
      setGeneratedPassword(data.data.password);
      setNewAppPassName("");
      fetchAppPasswords();
    } catch {
      setAppPassError("Network error");
    } finally {
      setGeneratingAppPass(false);
    }
  }

  // ── Revoke App Password ───────────────────────────────

  async function handleRevokeAppPassword(id: number) {
    if (
      !confirm(
        "Revoke this application password? Apps using it will lose access.",
      )
    )
      return;
    setDeletingAppPassId(id);
    try {
      const res = await fetch(
        `${getBaseUrl()}/api/users/me/app-passwords/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        setAppPassError("Failed to revoke");
        return;
      }
      setAppPasswords((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setAppPassError("Network error");
    } finally {
      setDeletingAppPassId(null);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedGenerated(true);
    setTimeout(() => setCopiedGenerated(false), 2000);
  }

  const roleColor =
    ROLE_COLORS[user?.role as RoleName] ?? "bg-gray-100 text-gray-600";
  const roleLabel = ROLE_LABELS[user?.role as RoleName] ?? user?.role;
  const initials = (user?.name || user?.email || "?")[0]?.toUpperCase();

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.name || user?.email}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}
            >
              <Shield size={10} />
              {roleLabel}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={10} />
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <SectionCard
        title="Profile Information"
        description="Update your display name"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your name"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>

          {profileError && (
            <p className="text-sm text-destructive">{profileError}</p>
          )}
          {profileSuccess && (
            <p className="text-sm text-green-600">✓ {profileSuccess}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard
        title="Change Password"
        description="Set a new password for your account"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-600">✓ {passwordSuccess}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {savingPassword ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Key size={14} />
              )}
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Account Info */}
      <SectionCard title="Account Information">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={14} /> Member since
            </span>
            <span className="text-sm text-foreground font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <User size={14} /> User ID
            </span>
            <span className="text-sm text-foreground font-mono">
              #{user?.id}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
