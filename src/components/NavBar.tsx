"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/dashboard", label: "Today" },
  { href: "/train", label: "Train" },
  { href: "/track", label: "Track" },
  { href: "/progress", label: "Progress" },
  { href: "/more", label: "More" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function loadLogo() {
      // Logo is a global brand setting controlled by the admin,
      // not per-user — look up the admin's row regardless of who's
      // currently logged in.
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      if (!adminProfile) return;

      const { data } = await supabase
        .from("brand_settings")
        .select("logo_url")
        .eq("user_id", adminProfile.id)
        .maybeSingle();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    }
    loadLogo();
  }, []);

  return (
    <>
      {/* Mobile: top bar with logo + bottom tab bar */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-center px-4 pb-3 border-b border-white/10 bg-background"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-14 object-contain" />
        ) : (
          <span className="font-bold text-lg">Golf Athlete</span>
        )}
      </header>
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden card border-t border-white/10 flex z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex items-center justify-center text-center text-sm py-4 min-h-[56px] ${
                active ? "text-primary font-semibold bg-primary/10" : "opacity-70"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: left sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-56 md:min-h-screen card border-r border-white/10 p-4 gap-2">
        <div className="mb-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
          ) : (
            <p className="text-lg font-bold">Golf Athlete</p>
          )}
        </div>
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 rounded-card ${
                active ? "bg-primary/10 text-primary font-semibold" : "opacity-70"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
