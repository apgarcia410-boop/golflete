"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Food = {
  id: string;
  name: string;
  unit: string;
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fat_per_unit: number;
};

export default function FoodLibraryPage() {
  const supabase = createClient();
  const [foods, setFoods] = useState<Food[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editCal, setEditCal] = useState("");
  const [editPro, setEditPro] = useState("");
  const [editCarb, setEditCarb] = useState("");
  const [editFat, setEditFat] = useState("");

  // Add-new form (helper: enter totals for an amount, computes per-unit)
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newUnit, setNewUnit] = useState("");
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
      .select("*")
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
    setEditUnit(f.unit);
    setEditCal(f.calories_per_unit.toString());
    setEditPro(f.protein_per_unit.toString());
    setEditCarb(f.carbs_per_unit.toString());
    setEditFat(f.fat_per_unit.toString());
  }

  async function saveEdit(id: string) {
    await supabase
      .from("food_library")
      .update({
        name: editName,
        unit: editUnit,
        calories_per_unit: editCal ? parseFloat(editCal) : 0,
        protein_per_unit: editPro ? parseFloat(editPro) : 0,
        carbs_per_unit: editCarb ? parseFloat(editCarb) : 0,
        fat_per_unit: editFat ? parseFloat(editFat) : 0,
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
    if (!user || !newName || !newAmount || !newUnit) return;

    const amt = parseFloat(newAmount);
    const cal = newCal ? parseFloat(newCal) : 0;
    const pro = newPro ? parseFloat(newPro) : 0;
    const carb = newCarb ? parseFloat(newCarb) : 0;
    const fat = newFat ? parseFloat(newFat) : 0;

    await supabase.from("food_library").insert({
      user_id: user.id,
      name: newName,
      unit: newUnit,
      calories_per_unit: amt > 0 ? cal / amt : 0,
      protein_per_unit: amt > 0 ? pro / amt : 0,
      carbs_per_unit: amt > 0 ? carb / amt : 0,
      fat_per_unit: amt > 0 ? fat / amt : 0,
    });

    setNewName("");
    setNewAmount("");
    setNewUnit("");
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
          <Link href="/track" className="text-sm opacity-60 underline">
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
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Amount (e.g. 8)"
              inputMode="decimal"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
            />
            <input
              placeholder="Unit (e.g. oz)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
            />
          </div>
          <p className="text-xs opacity-60">Enter the total macros for that amount:</p>
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
                      placeholder="Unit"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                    />
                  </div>
                  <p className="text-xs opacity-60">Macros per {editUnit || "unit"}:</p>
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
                      Per {f.unit}: {Math.round(f.calories_per_unit)} cal ·{" "}
                      {Math.round(f.protein_per_unit)}g P ·{" "}
                      {Math.round(f.carbs_per_unit)}g C ·{" "}
                      {Math.round(f.fat_per_unit)}g F
                    </p>
                  </div>
                  <span className="flex gap-3 text-sm">
                    <button onClick={() => startEdit(f)} className="text-primary underline">
                      Edit
                    </button>
                    <button onClick={() => deleteFood(f.id)} className="text-error underline">
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
