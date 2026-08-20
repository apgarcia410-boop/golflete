"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Session = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  location: string | null;
  notes: string | null;
  program_workout_id: string | null;
  duration_minutes: number | null;
};

function toDatetimeLocalValue(isoString: string) {
  // Converts a stored UTC timestamp into the local-time string
  // format the <input type="datetime-local"> control expects.
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

type SetRow = {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
};

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [exerciseNames, setExerciseNames] = useState<Map<string, string>>(new Map());
  const [workoutTitle, setWorkoutTitle] = useState<string | null>(null);

  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editRpe, setEditRpe] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionLocation, setSessionLocation] = useState<"station" | "home">("home");
  const [sessionDuration, setSessionDuration] = useState("");
  const [sessionDateTime, setSessionDateTime] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function loadAll() {
    const { data: sessionData } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!sessionData) return;
    setSession(sessionData as Session);
    setSessionNotes(sessionData.notes ?? "");
    setSessionLocation((sessionData.location as "station" | "home") ?? "home");
    setSessionDuration(sessionData.duration_minutes?.toString() ?? "");
    setSessionDateTime(toDatetimeLocalValue(sessionData.started_at));

    if (sessionData.program_workout_id) {
      const { data: pw } = await supabase
        .from("program_workouts")
        .select("title")
        .eq("id", sessionData.program_workout_id)
        .single();
      if (pw) setWorkoutTitle(pw.title);
    }

    const { data: setRows } = await supabase
      .from("workout_sets")
      .select("id, exercise_id, set_number, weight, reps, rpe, notes")
      .eq("workout_session_id", params.id)
      .order("logged_at");

    if (setRows) {
      setSets(setRows as SetRow[]);
      const ids = Array.from(new Set(setRows.map((s) => s.exercise_id)));
      if (ids.length > 0) {
        const { data: exs } = await supabase
          .from("exercise_library")
          .select("id, name")
          .in("id", ids);
        setExerciseNames(new Map((exs ?? []).map((e) => [e.id, e.name])));
      }
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function startEditSet(s: SetRow) {
    setEditingSetId(s.id);
    setEditWeight(s.weight?.toString() ?? "");
    setEditReps(s.reps?.toString() ?? "");
    setEditRpe(s.rpe?.toString() ?? "");
    setEditNotes(s.notes ?? "");
  }

  async function saveSet(setId: string) {
    await supabase
      .from("workout_sets")
      .update({
        weight: editWeight ? parseFloat(editWeight) : null,
        reps: editReps ? parseInt(editReps) : null,
        rpe: editRpe ? parseFloat(editRpe) : null,
        notes: editNotes || null,
      })
      .eq("id", setId);
    setEditingSetId(null);
    loadAll();
  }

  async function deleteSet(setId: string) {
    await supabase.from("workout_sets").delete().eq("id", setId);
    loadAll();
  }

  async function saveSessionInfo() {
    const updates: Record<string, unknown> = {
      notes: sessionNotes || null,
      location: sessionLocation,
      duration_minutes: sessionDuration ? parseInt(sessionDuration) : null,
    };
    if (sessionDateTime) {
      const iso = new Date(sessionDateTime).toISOString();
      updates.started_at = iso;
      updates.completed_at = iso;
    }
    await supabase.from("workout_sessions").update(updates).eq("id", params.id);
    loadAll();
  }

  async function deleteWorkout() {
    await supabase.from("workout_sessions").delete().eq("id", params.id);
    router.push("/progress");
  }

  if (!session) {
    return (
      <div className="md:flex min-h-screen">
        <NavBar />
        <main className="flex-1 p-4 md:p-8">Loading…</main>
      </div>
    );
  }

  const setsByExercise = new Map<string, SetRow[]>();
  for (const s of sets) {
    const list = setsByExercise.get(s.exercise_id) ?? [];
    list.push(s);
    setsByExercise.set(s.exercise_id, list);
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <Link href="/progress" className="inline-block text-sm px-3 py-2 rounded-card border border-white/10">
            ← Back to Progress
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{workoutTitle ?? "Ad-hoc Workout"}</h1>
          <p className="text-sm opacity-60">
            {new Date(session.started_at).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {" · "}
            {session.status}
            {session.duration_minutes ? ` · ${session.duration_minutes} min` : ""}
          </p>
        </div>

        <section className="card p-4 space-y-3">
          <h2 className="font-semibold">Session Info</h2>
          <div>
            <label className="block text-sm opacity-70 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={sessionDateTime}
              onChange={(e) => setSessionDateTime(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSessionLocation("home")}
              className={`flex-1 py-2 rounded-card border ${
                sessionLocation === "home" ? "border-primary text-primary" : "border-white/10"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setSessionLocation("station")}
              className={`flex-1 py-2 rounded-card border ${
                sessionLocation === "station" ? "border-primary text-primary" : "border-white/10"
              }`}
            >
              Station
            </button>
          </div>
          <div>
            <label className="block text-sm opacity-70 mb-1">Duration (minutes)</label>
            <input
              type="number"
              inputMode="numeric"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
            />
          </div>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Notes about this session"
            className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5"
            rows={2}
          />
          <button onClick={saveSessionInfo} className="btn-primary w-full py-2.5">
            Save Session Info
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Sets Logged</h2>
          {setsByExercise.size === 0 && (
            <p className="text-sm opacity-50">No sets were logged for this session.</p>
          )}
          {Array.from(setsByExercise.entries()).map(([exerciseId, exerciseSets]) => (
            <div key={exerciseId} className="card p-4 space-y-2">
              <p className="font-semibold text-sm">
                {exerciseNames.get(exerciseId) ?? "Unknown exercise"}
              </p>
              {exerciseSets.map((s) => (
                <div key={s.id} className="border-t border-white/10 pt-2">
                  {editingSetId === s.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          placeholder="Weight"
                          inputMode="decimal"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                        />
                        <input
                          placeholder="Reps"
                          inputMode="numeric"
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                        />
                        <input
                          placeholder="RPE"
                          inputMode="decimal"
                          value={editRpe}
                          onChange={(e) => setEditRpe(e.target.value)}
                          className="bg-background border border-white/10 rounded-card px-2 py-2 text-center"
                        />
                      </div>
                      <input
                        placeholder="Notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-card px-2 py-2.5"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveSet(s.id)}
                          className="btn-primary flex-1 py-2.5 text-sm min-h-[44px]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSetId(null)}
                          className="flex-1 py-2 rounded-card border border-white/10 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        Set {s.set_number}: {s.weight ?? "–"} × {s.reps ?? "–"}
                        {s.rpe ? ` @ RPE ${s.rpe}` : ""}
                        {s.notes ? ` — ${s.notes}` : ""}
                      </span>
                      <span className="flex gap-3">
                        <button
                          onClick={() => startEditSet(s)}
                          className="px-4 py-2.5 rounded-card border border-primary/40 text-primary text-sm font-medium min-h-[44px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSet(s.id)}
                          className="px-4 py-2.5 rounded-card border border-error/40 text-error text-sm font-medium min-h-[44px]"
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className="card p-4 space-y-2">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 rounded-card border border-error text-error"
            >
              Delete This Workout
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-error">
                This permanently deletes the whole session and every set in it. This
                can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={deleteWorkout}
                  className="flex-1 py-2 rounded-card bg-error text-white"
                >
                  Yes, Delete It
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-card border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
