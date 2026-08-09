"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";

const PRESETS: Record<string, Record<string, string>> = {
  performance: {
    color_background: "#0F1113",
    color_surface: "#1A1D21",
    color_primary: "#22C55E",
    color_secondary: "#3B82F6",
    color_accent: "#F59E0B",
    color_text: "#F5F5F4",
  },
  fairway: {
    color_background: "#0E1A12",
    color_surface: "#16261B",
    color_primary: "#4ADE80",
    color_secondary: "#A3B18A",
    color_accent: "#D4A373",
    color_text: "#F1F5F0",
  },
  carbon: {
    color_background: "#0A0A0A",
    color_surface: "#161616",
    color_primary: "#E5E5E5",
    color_secondary: "#737373",
    color_accent: "#DC2626",
    color_text: "#FAFAFA",
  },
  classic: {
    color_background: "#F5F1E8",
    color_surface: "#FFFFFF",
    color_primary: "#1B4332",
    color_secondary: "#8B6F47",
    color_accent: "#C9A227",
    color_text: "#1A1A1A",
  },
  minimal: {
    color_background: "#FAFAFA",
    color_surface: "#FFFFFF",
    color_primary: "#111827",
    color_secondary: "#6B7280",
    color_accent: "#2563EB",
    color_text: "#111827",
  },
};

type Brand = {
  preset: string;
  color_background: string;
  color_surface: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_text: string;
  logo_url: string | null;
};

export default function BrandPage() {
  const supabase = createClient();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("brand_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setBrand(data as Brand);
    }
    load();
  }, [supabase]);

  function applyLive(next: Partial<Brand>) {
    setBrand((prev) => (prev ? { ...prev, ...next } : prev));
    const root = document.documentElement;
    const map: Record<string, string> = {
      color_background: "--color-background",
      color_surface: "--color-surface",
      color_primary: "--color-primary",
      color_secondary: "--color-secondary",
      color_accent: "--color-accent",
      color_text: "--color-text",
    };
    for (const [key, cssVar] of Object.entries(map)) {
      const value = (next as Record<string, string>)[key];
      if (value) root.style.setProperty(cssVar, value);
    }
  }

  function applyPreset(name: string) {
    const colors = PRESETS[name];
    if (!colors) return;
    applyLive({ preset: name, ...colors });
  }

  async function save() {
    if (!brand) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("brand_settings").update(brand).eq("user_id", user.id);
    }
    setSaving(false);
  }

  async function resetDefault() {
    applyPreset("performance");
    await save();
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("brand-assets").getPublicUrl(path);
      applyLive({ logo_url: publicUrl.publicUrl });
      await supabase
        .from("brand_settings")
        .update({ logo_url: publicUrl.publicUrl })
        .eq("user_id", user.id);
    }
    setUploading(false);
  }

  if (!brand) {
    return (
      <div className="md:flex min-h-screen">
        <NavBar />
        <main className="flex-1 p-4 md:p-8">Loading…</main>
      </div>
    );
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-24 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Brand & Appearance</h1>

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Presets</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`py-2 rounded-card border capitalize ${
                  brand.preset === name ? "border-primary text-primary" : "border-white/10"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Colors</h2>
          {(
            [
              ["color_primary", "Primary"],
              ["color_secondary", "Secondary"],
              ["color_accent", "Accent"],
              ["color_background", "Background"],
              ["color_surface", "Surface"],
              ["color_text", "Text"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <input
                type="color"
                value={brand[key]}
                onChange={(e) => applyLive({ [key]: e.target.value, preset: "custom" })}
                className="w-10 h-8 rounded"
              />
            </div>
          ))}
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Logo</h2>
          {brand.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt="Logo" className="h-16 object-contain" />
          )}
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} />
          {uploading && <p className="text-sm opacity-60">Uploading…</p>}
        </section>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2">
            {saving ? "Saving…" : "Save Brand"}
          </button>
          <button onClick={resetDefault} className="flex-1 py-2 rounded-card border border-white/10">
            Reset to Default
          </button>
        </div>
      </main>
    </div>
  );
}
