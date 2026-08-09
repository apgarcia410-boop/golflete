"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Today" },
  { href: "/train", label: "Train" },
  { href: "/track", label: "Track" },
  { href: "/progress", label: "Progress" },
  { href: "/brand", label: "More" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden card border-t border-white/10 flex justify-around py-2 z-50">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-xs px-3 py-1 rounded-card ${
                active ? "text-primary font-semibold" : "opacity-60"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: left sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-56 md:min-h-screen card border-r border-white/10 p-4 gap-2">
        <p className="text-lg font-bold mb-4">Golf Athlete</p>
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
