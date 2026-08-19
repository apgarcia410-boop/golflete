"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

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

type FoodLibraryItem = {
  id: string;
  name: string;
  serving_size_amount: number;
  serving_size_unit: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
};

type MealEntry = {
  id: string;
  food_name: string;
  servings: number | null;
  serving_size_amount: number | null;
  serving_size_unit: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

type Targets = {
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
};

export default function TrackPage() {
  const supabase = createClient();
  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const [water, setWater] = useState("");

  const [sleep, setSleep] = useState("");
  const [energy, setEnergy] = useState("3");
  const [soreness, setSoreness] = useState("3");
  const [stress, setStress] = useState("3");

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // --- Nutrition state ---
  const [library, setLibrary] = useState<FoodLibraryItem[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<MealEntry[]>([]);
  const [targets, setTargets] = useState<Targets | null>(null);

  const [mode, setMode] = useState<"library" | "quick">("library");

  // Library mode
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [servingsConsumed, setServingsConsumed] = useState("1");

  // Quick-add mode
  const [quickName, setQuickName] = useState("");
  const [quickServingAmount, setQuickServingAmount] = useState("");
  const [quickServingUnit, setQuickServingUnit] = useState("");
  const [quickCalories, setQuickCalories] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");
  const [rememberFood, setRememberFood] = useState(false);

  async function getUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  }

  async function loadNutrition() {
    const userId = await getUserId();
    if (!userId) return;

    const { data: lib } = await supabase
      .from("food_library")
      .select(
        "id, name, serving_size_amount, serving_size_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving"
      )
      .eq("user_id", userId)
      .order("name");
    if (lib) {
      setLibrary(lib as FoodLibraryItem[]);
      if (lib.length > 0 && !selectedFoodId) setSelectedFoodId(lib[0].id);
    }

    const { data: meals } = await supabase
      .from("meal_entries")
      .select(
        "id, food_name, servings, serving_size_amount, serving_size_unit, calories, protein_g, carbs_g, fat_g"
      )
      .eq("user_id", userId)
      .eq("logged_date", selectedDate)
      .order("logged_at");
    if (meals) setTodaysMeals(meals as MealEntry[]);

    const { data: waterRow } = await supabase
      .from("nutrition_logs")
      .select("water_oz")
      .eq("user_id", userId)
      .eq("logged_date", selectedDate)
      .maybeSingle();
    setWater(waterRow?.water_oz != null ? String(waterRow.water_oz) : "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_calories, target_protein_g, target_carbs_g, target_fat_g")
      .eq("id", userId)
      .maybeSingle();
    if (profile) setTargets(profile as Targets);
  }

  useEffect(() => {
    loadNutrition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  function goToPreviousDay() {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
  }

  function goToNextDay() {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    );
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

  async function saveWater() {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("nutrition_logs").upsert(
      { user_id: userId, logged_date: selectedDate, water_oz: water ? parseFloat(water) : null },
      { onConflict: "user_id,logged_date" }
    );
    setSavedMsg("Water saved");
  }

  async function addFromLibrary() {
    const userId = await getUserId();
    const food = library.find((f) => f.id === selectedFoodId);
    if (!userId || !food || !servingsConsumed) return;

    const servings = parseFloat(servingsConsumed);
    await supabase.from("meal_entries").insert({
      user_id: userId,
      logged_date: selectedDate,
      food_id: food.id,
      food_name: food.name,
      servings,
      serving_size_amount: food.serving_size_amount,
      serving_size_unit: food.serving_size_unit,
      calories: servings * food.calories_per_serving,
      protein_g: servings * food.protein_per_serving,
      carbs_g: servings * food.carbs_per_serving,
      fat_g: servings * food.fat_per_serving,
      // legacy columns, kept satisfied for backward compatibility
      amount: servings * food.serving_size_amount,
      unit: food.serving_size_unit,
    });

    setServingsConsumed("1");
    setSavedMsg(`Logged ${food.name}`);
    loadNutrition();
  }

  async function addQuick() {
    const userId = await getUserId();
    if (!userId || !quickName) return;

    const servingAmt = quickServingAmount ? parseFloat(quickServingAmount) : 1;
    const cal = quickCalories ? parseFloat(quickCalories) : null;
    const pro = quickProtein ? parseFloat(quickProtein) : null;
    const carb = quickCarbs ? parseFloat(quickCarbs) : null;
    const fat = quickFat ? parseFloat(quickFat) : null;

    await supabase.from("meal_entries").insert({
      user_id: userId,
      logged_date: selectedDate,
      food_id: null,
      food_name: quickName,
      servings: 1,
      serving_size_amount: servingAmt,
      serving_size_unit: quickServingUnit || "serving",
      calories: cal,
      protein_g: pro,
      carbs_g: carb,
      fat_g: fat,
      // legacy columns
      amount: servingAmt,
      unit: quickServingUnit || "serving",
    });

    if (rememberFood) {
      await supabase.from("food_library").insert({
        user_id: userId,
        name: quickName,
        serving_size_amount: servingAmt,
        serving_size_unit: quickServingUnit || "serving",
        calories_per_serving: cal ?? 0,
        protein_per_serving: pro ?? 0,
        carbs_per_serving: carb ?? 0,
        fat_per_serving: fat ?? 0,
        // legacy columns
        unit: quickServingUnit || "serving",
        calories_per_unit: 0,
        protein_per_unit: 0,
        carbs_per_unit: 0,
        fat_per_unit: 0,
      });
    }

    setQuickName("");
    setQuickServingAmount("");
    setQuickServingUnit("");
    setQuickCalories("");
    setQuickProtein("");
    setQuickCarbs("");
    setQuickFat("");
    setRememberFood(false);
    setSavedMsg(`Logged ${quickName}`);
    loadNutrition();
  }

  async function deleteMeal(id: string) {
    await supabase.from("meal_entries").delete().eq("id", id);
    loadNutrition();
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

  const totals = todaysMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const selectedFood = library.find((f) => f.id === selectedFoodId);
  const previewServings = servingsConsumed ? parseFloat(servingsConsumed) : 0;

  function macroRow(label: string, consumed: number, target: number | null) {
    return (
      <div className="flex justify-between text-sm">
        <span className="opacity-70">{label}</span>
        <span>
          {Math.round(consumed)}
          {target ? ` / ${target}` : ""}
          {target ? (
            <span className="opacity-50"> ({Math.round(target - consumed)} left)</span>
          ) : null}
        </span>
      </div>
    );
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
          <button onClick={saveBody} className="btn-primary w-full py-2.5">Save Body Stats</button>
        </section>

        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={goToPreviousDay} className="text-sm px-3 py-2 rounded-card border border-white/10 opacity-80">
              ← Prev
            </button>
            <h2 className="font-semibold text-center">
              Nutrition
              <br />
              <span className="text-sm font-normal opacity-70">
                {isToday
                  ? "Today"
                  : new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
              </span>
            </h2>
            <button
              onClick={goToNextDay}
              disabled={isToday}
              className={`text-sm px-3 py-2 rounded-card border ${isToday ? "opacity-20 border-white/10" : "opacity-80 border-white/10"}`}
            >
              Next →
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2 text-sm text-center"
          />

          {!isToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs text-primary px-3 py-2 rounded-card border border-primary/40 block text-center"
            >
              Jump back to today
            </button>
          )}

          <Link href="/food-library" className="text-xs text-primary px-3 py-2 rounded-card border border-primary/40 block text-center">
            Manage Food Library →
          </Link>

          <div className="space-y-1 border-b border-white/10 pb-3 mb-1">
            {macroRow("Calories", totals.calories, targets?.target_calories ?? null)}
            {macroRow("Protein (g)", totals.protein, targets?.target_protein_g ?? null)}
            {macroRow("Carbs (g)", totals.carbs, targets?.target_carbs_g ?? null)}
            {macroRow("Fat (g)", totals.fat, targets?.target_fat_g ?? null)}
            {!targets?.target_calories && (
              <p className="text-xs opacity-50 pt-1">
                Set daily targets on your Profile page to see remaining amounts.
              </p>
            )}
          </div>

          {todaysMeals.length > 0 && (
            <div className="space-y-1 border-b border-white/10 pb-3 mb-1">
              {todaysMeals.map((m) => (
                <div key={m.id} className="flex justify-between items-center text-sm">
                  <span>
                    {m.food_name}
                    {m.servings ? ` — ${m.servings} serving${m.servings === 1 ? "" : "s"}` : ""}
                    {m.serving_size_amount && m.serving_size_unit
                      ? ` (${Math.round((m.servings ?? 1) * m.serving_size_amount)}${m.serving_size_unit})`
                      : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="opacity-60">{Math.round(m.calories ?? 0)} cal</span>
                    <button onClick={() => deleteMeal(m.id)} className="px-4 py-2.5 rounded-card border border-error/40 text-error text-sm font-medium min-h-[44px]">
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setMode("library")}
              className={`flex-1 py-2 rounded-card border text-sm ${
                mode === "library" ? "border-primary text-primary" : "border-white/10"
              }`}
            >
              From Library
            </button>
            <button
              onClick={() => setMode("quick")}
              className={`flex-1 py-2 rounded-card border text-sm ${
                mode === "quick" ? "border-primary text-primary" : "border-white/10"
              }`}
            >
              Quick Add
            </button>
          </div>

          {mode === "library" ? (
            library.length === 0 ? (
              <p className="text-sm opacity-60">
                No foods saved yet — use Quick Add and check "remember this food" to
                build your library.
              </p>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
                >
                  {library.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (1 serving = {f.serving_size_amount}{f.serving_size_unit})
                    </option>
                  ))}
                </select>
                <div>
                  <label className="block text-xs opacity-60 mb-1">
                    Number of servings
                    {selectedFood
                      ? ` (1 serving = ${selectedFood.serving_size_amount}${selectedFood.serving_size_unit})`
                      : ""}
                  </label>
                  <input
                    placeholder="e.g. 1, 1.5, 2"
                    inputMode="decimal"
                    value={servingsConsumed}
                    onChange={(e) => setServingsConsumed(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-3 py-2 text-center"
                  />
                </div>
                {selectedFood && previewServings > 0 && (
                  <p className="text-xs opacity-60">
                    {previewServings} serving{previewServings === 1 ? "" : "s"} ={" "}
                    {Math.round(previewServings * selectedFood.serving_size_amount)}
                    {selectedFood.serving_size_unit} → ≈{" "}
                    {Math.round(previewServings * selectedFood.calories_per_serving)} cal ·{" "}
                    {Math.round(previewServings * selectedFood.protein_per_serving)}g protein ·{" "}
                    {Math.round(previewServings * selectedFood.carbs_per_serving)}g carbs ·{" "}
                    {Math.round(previewServings * selectedFood.fat_per_serving)}g fat
                  </p>
                )}
                <button onClick={addFromLibrary} className="btn-primary w-full py-2.5">
                  {isToday ? "Add to Today" : `Add to ${selectedDate}`}
                </button>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <input
                placeholder="Food name"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
              />
              <p className="text-xs opacity-60">How much are you eating right now?</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Amount (e.g. 4)"
                  inputMode="decimal"
                  value={quickServingAmount}
                  onChange={(e) => setQuickServingAmount(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                />
                <input
                  placeholder="Unit (e.g. oz)"
                  value={quickServingUnit}
                  onChange={(e) => setQuickServingUnit(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                />
              </div>
              <p className="text-xs opacity-60">
                Total macros for that exact amount:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Calories" inputMode="decimal" value={quickCalories}
                  onChange={(e) => setQuickCalories(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                <input placeholder="Protein (g)" inputMode="decimal" value={quickProtein}
                  onChange={(e) => setQuickProtein(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                <input placeholder="Carbs (g)" inputMode="decimal" value={quickCarbs}
                  onChange={(e) => setQuickCarbs(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                <input placeholder="Fat (g)" inputMode="decimal" value={quickFat}
                  onChange={(e) => setQuickFat(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
              </div>
              <label className="flex items-center gap-3 text-sm opacity-80 py-2">
                <input
                  type="checkbox"
                  checked={rememberFood}
                  onChange={(e) => setRememberFood(e.target.checked)}
                  className="w-6 h-6 shrink-0"
                />
                Remember this food (saves "{quickServingAmount || "?"}
                {quickServingUnit || "unit"}" as its serving size for next time)
              </label>
              <button onClick={addQuick} className="btn-primary w-full py-2.5">
                {isToday ? "Add to Today" : `Add to ${selectedDate}`}
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-white/10">
            <label className="block text-sm opacity-70 mb-1">Water (oz)</label>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                value={water}
                onChange={(e) => setWater(e.target.value)}
                className="flex-1 bg-background border border-white/10 rounded-card px-2 py-2 text-center"
              />
              <button onClick={saveWater} className="btn-primary px-4 py-2.5 text-sm min-h-[44px]">
                Save
              </button>
            </div>
          </div>
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
          <button onClick={saveReadiness} className="btn-primary w-full py-2.5">Save Readiness</button>
        </section>
      </main>
    </div>
  );
}
