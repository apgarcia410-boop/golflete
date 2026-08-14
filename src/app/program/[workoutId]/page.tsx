"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Exercise = { id: string; name: string };

type PlanExercise = {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_rpe: number | null;
  notes: string | null;
};

export default function ProgramWorkoutEditPage({
  params,
}: {
  params: { workoutId: string };
}) {
  const supabase = createClient();

  const [title, setTitle] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExerciseId, setEditExerciseId] = useState("");
  const [editSets, setEditSets] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editRpe, setEditRpe] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [newExerciseId, setNewExerciseId] = useState("");
  const [newSets, setNewSets] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newRpe, setNewRpe] = useState("");
  const [newNotes, setNewNotes] = useState("");

  async function load() {
    const { data: workout } = await supabase
      .from("program_workouts")
      .select("title, notes")
      .eq("id", params.workoutId)
      .single();
    if (workout) {
      setTitle(workout.title);
      setNotes(workout.notes);
    }

    const { data: exercises } = await supabase
      .from("program_exercises")
      .select("id, exercise_id, order_index, target_sets, target_reps, target_rpe, notes")
      .eq("program_workout_id", params.workoutId)
      .order("order_index");
    if (exercises) setPlan(exercises as PlanExercise[]);

    const { data: lib } = await supabase
      .from("exercise_library")
      .select("id, name")
      .order("name");
    if (lib) {
      setLibrary(lib as Exercise[]);
      if (lib.length > 0 && !newExerciseId) setNewExerciseId(lib[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.workoutId]);

  function exerciseName(id: string) {
    return library.find((e) => e.id === id)?.name ?? "Unknown exercise";
  }

  function startEdit(p: PlanExercise) {
    setEditingId(p.id);
    setEditExerciseId(p.exercise_id);
    setEditSets(p.target_sets?.toString() ?? "");
    setEditReps(p.target_reps ?? "");
    setEditRpe(p.target_rpe?.toString() ?? "");
    setEditNotes(p.notes ?? "");
  }

  async function saveEdit(id: string) {
    await supabase
      .from("program_exercises")
      .update({
        exercise_id: editExerciseId,
        target_sets: editSets ? parseInt(editSets) : null,
        target_reps: editReps || null,
        target_rpe: editRpe ? parseFloat(editRpe) : null,
        notes: editNotes || null,
      })
      .eq("id", id);
    setEditingId(null);
    load();
  }

  async function removeExercise(id: string) {
    await supabase.from("program_exercises").delete().eq("id", id);
    load();
  }

  async function addExercise() {
    if (!newExerciseId) return;
    const nextOrder =
      plan.length > 0 ? Math.max(...plan.map((p) => p.order_index)) + 1 : 1;

    await supabase.from("program_exercises").insert({
      program_workout_id: params.workoutId,
      exercise_id: newExerciseId,
      order_index: nextOrder,
      target_sets: newSets ? parseInt(newSets) : null,
      target_reps: newReps || null,
      target_rpe: newRpe ? parseFloat(newRpe) : null,
      notes: newNotes || null,
    });

    setNewSets("");
    setNewReps("");
    setNewRpe("");
    setNewNotes("");
    load();
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <Link href="/program" className="inline-block text-sm px-3 py-2 rounded-card border border-white/10">
            ← Back to Program
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{title ?? "Workout"}</h1>
          {notes && <p className="text-sm opacity-60 mt-1">{notes}</p>}
        </div>

        <section className="space-y-2">
          {plan.map((p) => (
            <div key={p.id} className="card p-4">
              {editingId === p.id ? (
                <div className="space-y-2">
                  <select
                    value={editExerciseId}
                    onChange={(e) => setEditExerciseId(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-2 py-2"
                  >
                    {library.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Sets" inputMode="numeric" value={editSets}
                      onChange={(e) => setEditSets(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                    <input placeholder="Reps (e.g. 8-10)" value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                    <input placeholder="RPE" inputMode="decimal" value={editRpe}
                      onChange={(e) => setEditRpe(e.target.value)}
                      className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
                  </div>
                  <input
                    placeholder="Notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-card px-2 py-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(p.id)} className="btn-primary flex-1 py-2 text-sm">
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
                    <p className="text-sm font-medium">{exerciseName(p.exercise_id)}</p>
                    <p className="text-xs opacity-60">
                      {p.target_sets
                        ? p.target_reps
                          ? `${p.target_sets} × ${p.target_reps}`
                          : `${p.target_sets} sets`
                        : ""}
                      {p.target_rpe ? ` @ RPE ${p.target_rpe}` : ""}
                    </p>
                    {p.notes && <p className="text-xs opacity-50">{p.notes}</p>}
                  </div>
                  <span className="flex gap-3 text-sm">
                    <button onClick={() => startEdit(p)} className="px-3 py-1.5 rounded-card border border-primary/40 text-primary text-xs font-medium">
                      Edit
                    </button>
                    <button onClick={() => removeExercise(p.id)} className="px-3 py-1.5 rounded-card border border-error/40 text-error text-xs font-medium">
                      Remove
                    </button>
                  </span>
                </div>
              )}
            </div>
          ))}
          {plan.length === 0 && (
            <p className="text-sm opacity-50">No exercises in this session yet.</p>
          )}
        </section>

        <section className="card p-4 space-y-2">
          <h2 className="font-semibold">Add an Exercise</h2>
          <select
            value={newExerciseId}
            onChange={(e) => setNewExerciseId(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2"
          >
            {library.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Sets" inputMode="numeric" value={newSets}
              onChange={(e) => setNewSets(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="Reps (e.g. 8-10)" value={newReps}
              onChange={(e) => setNewReps(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
            <input placeholder="RPE" inputMode="decimal" value={newRpe}
              onChange={(e) => setNewRpe(e.target.value)}
              className="bg-background border border-white/10 rounded-card px-2 py-2 text-center" />
          </div>
          <input
            placeholder="Notes (optional)"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2"
          />
          <button onClick={addExercise} className="btn-primary w-full py-2">
            Add to This Session
          </button>
        </section>

        <Link
          href={`/train?workout=${params.workoutId}`}
          className="btn-primary block text-center py-3"
        >
          Start This Workout
        </Link>
      </main>
    </div>
  );
}
