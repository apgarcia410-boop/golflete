"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Profile = {
  full_name: string | null;
  height_inches: number | null;
  current_weight_lb: number | null;
  target_weight_lb: number | null;
  target_body_fat_low: number | null;
  target_body_fat_high: number | null;
  schedule_type: string | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
};

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else {
        // No row yet (e.g. it never got created on signup) — start
        // with a blank form instead of hanging on "Loading…" forever.
        setProfile({
          full_name: null,
          height_inches: null,
          current_weight_lb: null,
          target_weight_lb: null,
          target_body_fat_low: null,
          target_body_fat_high: null,
          schedule_type: "standard",
          target_calories: null,
          target_protein_g: null,
          target_carbs_g: null,
          target_fat_g: null,
        });
      }
    }
    load();
  }, [supabase]);

  function update(field: keyof Profile, value: string) {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profile.full_name || null,
        height_inches: profile.height_inches ? Number(profile.height_inches) : null,
        current_weight_lb: profile.current_weight_lb
          ? Number(profile.current_weight_lb)
          : null,
        target_weight_lb: profile.target_weight_lb
          ? Number(profile.target_weight_lb)
          : null,
        target_body_fat_low: profile.target_body_fat_low
          ? Number(profile.target_body_fat_low)
          : null,
        target_body_fat_high: profile.target_body_fat_high
          ? Number(profile.target_body_fat_high)
          : null,
        schedule_type: profile.schedule_type || null,
        target_calories: profile.target_calories ? Number(profile.target_calories) : null,
        target_protein_g: profile.target_protein_g
          ? Number(profile.target_protein_g)
          : null,
        target_carbs_g: profile.target_carbs_g ? Number(profile.target_carbs_g) : null,
        target_fat_g: profile.target_fat_g ? Number(profile.target_fat_g) : null,
      });
    }
    setSaving(false);
    setSavedMsg("Saved");
  }

  if (!profile) {
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
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <Link href="/more" className="inline-block text-sm px-3 py-2 rounded-card border border-white/10">
            ← Back to More
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Profile</h1>
        {savedMsg && <p className="text-success text-sm">{savedMsg}</p>}

        <section className="card p-4 space-y-3">
          <div>
            <label className="block text-sm opacity-70 mb-1">Name</label>
            <input
              value={profile.full_name ?? ""}
              onChange={(e) => update("full_name", e.target.value)}
              className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-1">Height (inches)</label>
            <input
              type="number"
              inputMode="decimal"
              value={profile.height_inches ?? ""}
              onChange={(e) => update("height_inches", e.target.value)}
              className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm opacity-70 mb-1">Current Weight (lb)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.current_weight_lb ?? ""}
                onChange={(e) => update("current_weight_lb", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Target Weight (lb)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_weight_lb ?? ""}
                onChange={(e) => update("target_weight_lb", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm opacity-70 mb-1">Target Body Fat % (low)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_body_fat_low ?? ""}
                onChange={(e) => update("target_body_fat_low", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Target Body Fat % (high)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_body_fat_high ?? ""}
                onChange={(e) => update("target_body_fat_high", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm opacity-70 mb-1">Schedule Type</label>
            <select
              value={profile.schedule_type ?? "standard"}
              onChange={(e) => update("schedule_type", e.target.value)}
              className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
            >
              <option value="standard">Standard</option>
              <option value="48_96_firefighter">48/96 Firefighter</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold mt-2 mb-1">Daily Nutrition Targets</p>
            <p className="text-xs opacity-60 mb-2">
              Used to show remaining/consumed on the Track page.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm opacity-70 mb-1">Calories</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_calories ?? ""}
                onChange={(e) => update("target_calories", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Protein (g)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_protein_g ?? ""}
                onChange={(e) => update("target_protein_g", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Carbs (g)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_carbs_g ?? ""}
                onChange={(e) => update("target_carbs_g", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Fat (g)</label>
              <input
                type="number"
                inputMode="decimal"
                value={profile.target_fat_g ?? ""}
                onChange={(e) => update("target_fat_g", e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
            </div>
          </div>

          <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </section>
      </main>
    </div>
  );
}
