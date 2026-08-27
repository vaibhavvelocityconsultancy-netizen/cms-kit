"use client";

import { useEffect, useState } from "react";
import { getBaseUrl } from "@/src/lib/config";

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

interface FooterSettings {
  footerLogo: string;
  footerBrandTitle: string;
  footerDescription: string;
  footerAddress: string;
  footerEmail: string;
  footerCopyright: string;
  socialLinks: SocialLink[];
}

interface Menu {
  id: number;
  name: string;
  location: string;
  items: any[];
}

interface UseFooterReturn {
  settings: FooterSettings;
  footerMenus: Menu[];
  loading: boolean;
}

const DEFAULT_SETTINGS: FooterSettings = {
  footerLogo: "",
  footerBrandTitle: "My Website",
  footerDescription: "",
  footerAddress: "",
  footerEmail: "",
  footerCopyright: `Â© ${new Date().getFullYear()} My Website. All rights reserved.`,
  socialLinks: [],
};

const SOCIAL_ICONS: Record<string, string> = {
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>`,
};

export { SOCIAL_ICONS, DEFAULT_SETTINGS };
export type { FooterSettings, SocialLink };

export function useFooter(): UseFooterReturn {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_SETTINGS);
  const [footerMenus, setFooterMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, menusRes] = await Promise.all([
          fetch(`${getBaseUrl()}/api/footer-setting/`),
          fetch(`${getBaseUrl()}/api/menus`),
        ]);

        const settingsData = await settingsRes.json();
        const menusData = await menusRes.json();

        if (settingsData.success && settingsData.data) {
          setSettings({ ...DEFAULT_SETTINGS, ...settingsData.data });
        }

        if (menusData.success && menusData.data) {
          const footerCols = menusData.data.filter(
            (m: Menu) => m.location === "footer",
          );
          setFooterMenus(footerCols);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { settings, footerMenus, loading };
}
