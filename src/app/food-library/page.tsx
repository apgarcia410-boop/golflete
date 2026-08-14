"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Food = {
  id: string;
  name: string;
  serving_size_amount: number;
  serving_size_unit: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
};

export default function FoodLibraryPage() {
  const supabase = createClient();
  const [foods, setFoods] = useState<Food[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editServingAmount, setEditServingAmount] = useState("");
  const [editServingUnit, setEditServingUnit] = useState("");
  const [editCal, setEditCal] = useState("");
  const [editPro, setEditPro] = useState("");
  const [editCarb, setEditCarb] = useState("");
  const [editFat, setEditFat] = useState("");

  const [newName, setNewName] = useState("");
  const [newServingAmount, setNewServingAmount] = useState("");
  const [newServingUnit, setNewServingUnit] = useState("");
  const [newCal, setNewCal] = useState("");
  const [newPro, setNewPro] = useState("");
  const [newCarb, setNewCarb] = useState("");
  const [newFat, setNewFat] = useState("");

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("food_library")
      .select(
        "id, name, serving_size_amount, serving_size_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving"
      )
      .eq("user_id", user.id)
      .order("name");
    if (data) setFoods(data as Food[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(f: Food) {
    setEditingId(f.id);
    setEditName(f.name);
    setEditServingAmount(f.serving_size_amount?.toString() ?? "");
    setEditServingUnit(f.serving_size_unit ?? "");
    setEditCal(f.calories_per_serving?.toString() ?? "");
    setEditPro(f.protein_per_serving?.toString() ?? "");
    setEditCarb(f.carbs_per_serving?.toString() ?? "");
    setEditFat(f.fat_per_serving?.toString() ?? "");
  }

  async function saveEdit(id: string) {
    await supabase
      .from("food_library")
      .update({
        name: editName,
        serving_size_amount: editServingAmount ? parseFloat(editServingAmount) : null,
        serving_size_unit: editServingUnit,
        calories_per_serving: editCal ? parseFloat(editCal) : 0,
        protein_per_serving: editPro ? parseFloat(editPro) : 0,
        carbs_per_serving: editCarb ? parseFloat(editCarb) : 0,
        fat_per_serving: editFat ? parseFloat(editFat) : 0,
      })
      .eq("id", id);
    setEditingId(null);
    load();
  }

  async function deleteFood(id: string) {
    await supabase.from("food_library").delete().eq("id", id);
    load();
  }

  async function addFood() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !newName || !newServingAmount || !newServingUnit) return;

    await supabase.from("food_library").insert({
      user_id: user.id,
      name: newName,
      serving_size_amount: parseFloat(newServingAmount),
      serving_size_unit: newServingUnit,
      calories_per_serving: newCal ? parseFloat(newCal) : 0,
      protein_per_serving: newPro ? parseFloat(newPro) : 0,
      carbs_per_serving: newCarb ? parseFloat(newCarb) : 0,
      fat_per_serving: newFat ? parseFloat(newFat) : 0,
      // legacy columns kept for compatibility with old rows — not used going forward
      unit: newServingUnit,
      calories_per_unit: 0,
      protein_per_unit: 0,
      carbs_per_unit: 0,
      fat_per_unit: 0,
    });

    setNewName("");
    setNewServingAmount("");
    setNewServingUnit("");
    setNewCal("");
    setNewPro("");
    setNewCarb("");
    setNewFat("");
    load();
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <Link href="/track" className="inline-block text-sm px-3 py-2 rounded-card border border-white/10">
            ← Back to Track
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Food Library</h1>

        <section className="card p-4 space-y-2">
          <h2 className="font-semibold">Add a New Food</h2>
          <input
            placeholder="Food name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2"
          />
          <p className="text-xs opacity-60">What does one serving look like?</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Serving size (e.g. 4)"
              inputMode="decimal"
              value={newServingAmount}
              onChange={(e) => setNewServingAmount(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
            />
            <input
              placeholder="Unit (e.g. oz)"
              value={newServingUnit}
              onChange={(e) => setNewServingUnit(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
            />
          </div>
          <p className="text-xs opacity-60">
            Macros for that one serving (straight off the label):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Calories" inputMode="decimal" value={newCal}
              onChange={(e) => setNewCal(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Protein (g)" inputMode="decimal" value={newPro}
              onChange={(e) => setNewPro(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Carbs (g)" inputMode="decimal" value={newCarb}
              onChange={(e) => setNewCarb(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Fat (g)" inputMode="decimal" value={newFat}
              onChange={(e) => setNewFat(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
          </div>
          <button onClick={addFood} className="btn-primary w-full py-2">
            Add to Library
          </button>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Your Foods</h2>
          {foods.length === 0 && (
            <p className="text-sm opacity-50">No foods saved yet.</p>
          )}
          {foods.map((f) => (
            <div key={f.id} className="card p-4">
              {editingId === f.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-2 py-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Serving size"
                      inputMode="decimal"
                      value={editServingAmount}
                      onChange={(e) => setEditServingAmount(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                    />
                    <input
                      placeholder="Unit"
                      value={editServingUnit}
                      onChange={(e) => setEditServingUnit(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                    />
                  </div>
                  <p className="text-xs opacity-60">
                    Macros per serving ({editServingAmount || "?"} {editServingUnit || "unit"}):
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Calories" inputMode="decimal" value={editCal}
                      onChange={(e) => setEditCal(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                    <input placeholder="Protein (g)" inputMode="decimal" value={editPro}
                      onChange={(e) => setEditPro(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                    <input placeholder="Carbs (g)" inputMode="decimal" value={editCarb}
                      onChange={(e) => setEditCarb(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                    <input placeholder="Fat (g)" inputMode="decimal" value={editFat}
                      onChange={(e) => setEditFat(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(f.id)} className="btn-primary flex-1 py-2 text-sm">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 rounded-card border border-white/10 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{f.name}</p>
                    <p className="text-xs opacity-60">
                      1 serving = {f.serving_size_amount}{f.serving_size_unit} ·{" "}
                      {Math.round(f.calories_per_serving)} cal ·{" "}
                      {Math.round(f.protein_per_serving)}g P ·{" "}
                      {Math.round(f.carbs_per_serving)}g C ·{" "}
                      {Math.round(f.fat_per_serving)}g F
                    </p>
                  </div>
                  <span className="flex gap-3 text-sm">
                    <button onClick={() => startEdit(f)} className="px-3 py-1.5 rounded-card border border-primary/40 text-primary text-xs font-medium">
                      Edit
                    </button>
                    <button onClick={() => deleteFood(f.id)} className="px-3 py-1.5 rounded-card border border-error/40 text-error text-xs font-medium">
                      Delete
                    </button>
                  </span>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
