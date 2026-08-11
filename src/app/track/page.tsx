"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";

function getLocalDateString() {
  // Builds YYYY-MM-DD from the device's local time, not UTC —
  // toISOString() would shift the date near midnight depending
  // on how far the local timezone is from UTC.
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TrackPage() {
  const supabase = createClient();
  const today = getLocalDateString();

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [water, setWater] = useState("");

  const [sleep, setSleep] = useState("");
  const [energy, setEnergy] = useState("3");
  const [soreness, setSoreness] = useState("3");
  const [stress, setStress] = useState("3");

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function getUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  }

  async function saveBody() {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("body_measurements").insert({
      user_id: userId,
      logged_date: today,
      weight_lb: weight ? parseFloat(weight) : null,
      waist_in: waist ? parseFloat(waist) : null,
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
    });
    setSavedMsg("Body stats saved");
  }

  async function saveNutrition() {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("nutrition_logs").upsert(
      {
        user_id: userId,
        logged_date: today,
        calories: calories ? parseFloat(calories) : null,
        protein_g: protein ? parseFloat(protein) : null,
        carbs_g: carbs ? parseFloat(carbs) : null,
        fat_g: fat ? parseFloat(fat) : null,
        water_oz: water ? parseFloat(water) : null,
      },
      { onConflict: "user_id,logged_date" }
    );
    setSavedMsg("Nutrition saved");
  }

  async function saveReadiness() {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("readiness_logs").upsert(
      {
        user_id: userId,
        logged_date: today,
        sleep_hours: sleep ? parseFloat(sleep) : null,
        energy: parseInt(energy),
        soreness: parseInt(soreness),
        stress: parseInt(stress),
      },
      { onConflict: "user_id,logged_date" }
    );
    setSavedMsg("Readiness saved");
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Track</h1>
        {savedMsg && <p className="text-success text-sm">{savedMsg}</p>}

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Body</h2>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Weight (lb)" inputMode="decimal" value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Waist (in)" inputMode="decimal" value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Body fat %" inputMode="decimal" value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
          </div>
          <button onClick={saveBody} className="btn-primary w-full py-2">Save Body Stats</button>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Nutrition</h2>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Calories" inputMode="decimal" value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Protein (g)" inputMode="decimal" value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Carbs (g)" inputMode="decimal" value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Fat (g)" inputMode="decimal" value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Water (oz)" inputMode="decimal" value={water}
              onChange={(e) => setWater(e.target.value)}
              className="col-span-2 bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
          </div>
          <button onClick={saveNutrition} className="btn-primary w-full py-2">Save Nutrition</button>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Readiness</h2>
          <input placeholder="Sleep hours" inputMode="decimal" value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <label className="block opacity-70 mb-1">Energy (1-5)</label>
              <input type="number" min={1} max={5} value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            </div>
            <div>
              <label className="block opacity-70 mb-1">Soreness (1-5)</label>
              <input type="number" min={1} max={5} value={soreness}
                onChange={(e) => setSoreness(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            </div>
            <div>
              <label className="block opacity-70 mb-1">Stress (1-5)</label>
              <input type="number" min={1} max={5} value={stress}
                onChange={(e) => setStress(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            </div>
          </div>
          <button onClick={saveReadiness} className="btn-primary w-full py-2">Save Readiness</button>
        </section>
      </main>
    </div>
  );
}
