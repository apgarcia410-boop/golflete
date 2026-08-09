"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";

type Exercise = { id: string; name: string; equipment: string | null };
type SetEntry = {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
};

export default function TrainPage() {
  const supabase = createClient();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [location, setLocation] = useState<"station" | "home">("home");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [loggedSets, setLoggedSets] = useState<SetEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("exercise_library")
      .select("id, name, equipment")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setExercises(data);
          if (data.length > 0) setSelectedExerciseId(data[0].id);
        }
      });
  }, [supabase]);

  async function startWorkout() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: user.id, location, status: "in_progress" })
      .select("id")
      .single();

    if (!error && data) setSessionId(data.id);
  }

  async function logSet() {
    if (!sessionId || !selectedExerciseId) return;
    setSaving(true);

    const setNumber =
      loggedSets.filter((s) => s.exercise_id === selectedExerciseId).length + 1;

    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        workout_session_id: sessionId,
        exercise_id: selectedExerciseId,
        set_number: setNumber,
        weight: weight ? parseFloat(weight) : null,
        reps: reps ? parseInt(reps) : null,
        rpe: rpe ? parseFloat(rpe) : null,
        notes: notes || null,
      })
      .select("*")
      .single();

    setSaving(false);

    if (!error && data) {
      setLoggedSets((prev) => [...prev, data as SetEntry]);
      setNotes("");
    }
  }

  async function finishWorkout() {
    if (!sessionId) return;
    await supabase
      .from("workout_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId);
    setSessionId(null);
    setLoggedSets([]);
  }

  const currentExerciseName = exercises.find((e) => e.id === selectedExerciseId)?.name;

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-24 md:pb-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Train</h1>

        {!sessionId ? (
          <div className="card p-4 space-y-3">
            <p className="text-sm opacity-70">Where are you training today?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setLocation("home")}
                className={`flex-1 py-2 rounded-card border ${
                  location === "home" ? "border-primary text-primary" : "border-white/10"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setLocation("station")}
                className={`flex-1 py-2 rounded-card border ${
                  location === "station" ? "border-primary text-primary" : "border-white/10"
                }`}
              >
                Station
              </button>
            </div>
            <button onClick={startWorkout} className="btn-primary w-full py-2">
              Start Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-4 space-y-3">
              <label className="block text-sm opacity-70">Exercise</label>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Weight"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-3 py-3 text-center text-lg"
                />
                <input
                  placeholder="Reps"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-3 py-3 text-center text-lg"
                />
                <input
                  placeholder="RPE"
                  inputMode="decimal"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  className="bg-background border border-white/10 rounded-card px-3 py-3 text-center text-lg"
                />
              </div>
              <input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-card px-3 py-2"
              />

              <button
                onClick={logSet}
                disabled={saving}
                className="btn-primary w-full py-3 text-lg"
              >
                {saving ? "Saving…" : `Log Set — ${currentExerciseName ?? ""}`}
              </button>
            </div>

            <div className="card p-4">
              <p className="text-sm opacity-70 mb-2">This Session</p>
              {loggedSets.length === 0 ? (
                <p className="text-sm opacity-50">No sets logged yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {loggedSets.map((s) => (
                    <li key={s.id}>
                      {exercises.find((e) => e.id === s.exercise_id)?.name} — set{" "}
                      {s.set_number}: {s.weight ?? "–"} × {s.reps ?? "–"}{" "}
                      {s.rpe ? `@ RPE ${s.rpe}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={finishWorkout}
              className="w-full py-3 rounded-card border border-white/10"
            >
              Finish Workout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
