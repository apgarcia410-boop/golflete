"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Category = { id: string; name: string };
type Exercise = {
  id: string;
  name: string;
  category_id: string | null;
  equipment: string | null;
};

export default function ExerciseLibraryPage() {
  const supabase = createClient();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editEquipment, setEditEquipment] = useState("");

  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newEquipment, setNewEquipment] = useState("");

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setIsAdmin(profile?.role === "admin");
    }

    const { data: cats } = await supabase
      .from("exercise_categories")
      .select("id, name")
      .order("name");
    if (cats) {
      setCategories(cats as Category[]);
      if (cats.length > 0 && !newCategoryId) setNewCategoryId(cats[0].id);
    }

    const { data: exs } = await supabase
      .from("exercise_library")
      .select("id, name, category_id, equipment")
      .order("name");
    if (exs) setExercises(exs as Exercise[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function categoryName(id: string | null) {
    return categories.find((c) => c.id === id)?.name ?? "uncategorized";
  }

  function startEdit(ex: Exercise) {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditCategoryId(ex.category_id ?? "");
    setEditEquipment(ex.equipment ?? "");
  }

  async function saveEdit(id: string) {
    await supabase
      .from("exercise_library")
      .update({
        name: editName,
        category_id: editCategoryId || null,
        equipment: editEquipment || null,
      })
      .eq("id", id);
    setEditingId(null);
    load();
  }

  async function deleteExercise(id: string) {
    await supabase.from("exercise_library").delete().eq("id", id);
    load();
  }

  async function addExercise() {
    if (!newName) return;
    await supabase.from("exercise_library").insert({
      name: newName,
      category_id: newCategoryId || null,
      equipment: newEquipment || null,
    });
    setNewName("");
    setNewEquipment("");
    load();
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <Link
            href="/more"
            className="inline-block text-sm px-3 py-2 rounded-card border border-white/10"
          >
            ← Back to More
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <p className="text-xs opacity-60">
          {isAdmin
            ? "Shared across every account — any exercise added here shows up in the picker on every workout session and program editor."
            : "The shared list of exercises available to build workouts from."}
        </p>

        {isAdmin && (
        <section className="card p-4 space-y-2">
          <h2 className="font-semibold">Add a New Exercise</h2>
          <input
            placeholder="Exercise name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
          />
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Equipment (e.g. dumbbell, bodyweight, cable)"
            value={newEquipment}
            onChange={(e) => setNewEquipment(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
          />
          <button onClick={addExercise} className="btn-primary w-full py-2.5">
            Add to Library
          </button>
        </section>
        )}

        <section className="space-y-2">
          <h2 className="font-semibold">Exercises ({exercises.length})</h2>
          {exercises.map((ex) => (
            <div key={ex.id} className="card p-4">
              {isAdmin && editingId === ex.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-2 py-2.5"
                  />
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-2 py-2.5"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Equipment"
                    value={editEquipment}
                    onChange={(e) => setEditEquipment(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-2 py-2.5"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(ex.id)} className="btn-primary flex-1 py-2.5 text-sm min-h-[44px]">
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
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <p className="text-xs opacity-60">
                      {categoryName(ex.category_id)}
                      {ex.equipment ? ` · ${ex.equipment}` : ""}
                    </p>
                  </div>
                  {isAdmin && (
                    <span className="flex gap-3 text-sm">
                      <button
                        onClick={() => startEdit(ex)}
                        className="px-4 py-2.5 rounded-card border border-primary/40 text-primary text-sm font-medium min-h-[44px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="px-4 py-2.5 rounded-card border border-error/40 text-error text-sm font-medium min-h-[44px]"
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
