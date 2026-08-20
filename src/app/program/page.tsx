"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Week = { id: string; week_number: number; label: string };
type Workout = { id: string; day_number: number; title: string; program_week_id: string };

export default function ProgramPage() {
  const supabase = createClient();
  const router = useRouter();

  const [programName, setProgramName] = useState<string | null>(null);
  const [versionLabel, setVersionLabel] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const [addingToWeek, setAddingToWeek] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_program_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.current_program_id) {
      setLoaded(true);
      return;
    }

    const { data: program } = await supabase
      .from("programs")
      .select("id, name")
      .eq("id", profile.current_program_id)
      .maybeSingle();
    if (!program) {
      setLoaded(true);
      return;
    }
    setProgramName(program.name);

    const { data: version } = await supabase
      .from("program_versions")
      .select("id, label")
      .eq("program_id", program.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (!version) {
      setLoaded(true);
      return;
    }
    setVersionLabel(version.label);
    setVersionId(version.id);

    const { data: weeksData } = await supabase
      .from("program_weeks")
      .select("id, week_number, label")
      .eq("program_version_id", version.id)
      .order("week_number");
    setWeeks((weeksData as Week[]) ?? []);

    const weekIds = (weeksData ?? []).map((w) => w.id);
    const { data: workoutsData } = await supabase
      .from("program_workouts")
      .select("id, day_number, title, program_week_id")
      .in("program_week_id", weekIds.length > 0 ? weekIds : [""])
      .order("day_number");
    setWorkouts((workoutsData as Workout[]) ?? []);

    const { data: completedSessions } = await supabase
      .from("workout_sessions")
      .select("program_workout_id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("program_workout_id", "is", null);
    setCompletedIds(new Set((completedSessions ?? []).map((s) => s.program_workout_id)));

    setLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function moveWorkout(weekId: string, workoutId: string, direction: "up" | "down") {
    const weekWorkouts = workouts
      .filter((w) => w.program_week_id === weekId)
      .sort((a, b) => a.day_number - b.day_number);

    const index = weekWorkouts.findIndex((w) => w.id === workoutId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= weekWorkouts.length) return;

    const current = weekWorkouts[index];
    const swapWith = weekWorkouts[swapIndex];

    // Swap day_number between the two — simplest way to reorder
    // without needing to renumber everything else in the week.
    await supabase
      .from("program_workouts")
      .update({ day_number: swapWith.day_number })
      .eq("id", current.id);
    await supabase
      .from("program_workouts")
      .update({ day_number: current.day_number })
      .eq("id", swapWith.id);

    load();
  }

  async function addWorkout(weekId: string) {
    if (!newTitle) return;
    const weekWorkouts = workouts.filter((w) => w.program_week_id === weekId);
    const nextDay =
      weekWorkouts.length > 0 ? Math.max(...weekWorkouts.map((w) => w.day_number)) + 1 : 1;

    const { data: inserted } = await supabase
      .from("program_workouts")
      .insert({
        program_week_id: weekId,
        day_number: nextDay,
        title: newTitle,
        notes: newNotes || null,
      })
      .select("id")
      .single();

    setNewTitle("");
    setNewNotes("");
    setAddingToWeek(null);

    if (inserted) {
      router.push(`/program/${inserted.id}`);
    } else {
      load();
    }
  }

  async function deleteWorkout(id: string) {
    // Unlink any logged sessions first so history is preserved,
    // just no longer tied to this (now-removed) planned session.
    await supabase
      .from("workout_sessions")
      .update({ program_workout_id: null })
      .eq("program_workout_id", id);
    await supabase.from("program_workouts").delete().eq("id", id);
    setConfirmDeleteId(null);
    load();
  }

  if (!loaded) {
    return (
      <div className="md:flex min-h-screen">
        <NavBar />
        <main className="flex-1 p-4 md:p-8">Loading…</main>
      </div>
    );
  }

  if (!versionId) {
    return (
      <div className="md:flex min-h-screen">
        <NavBar />
        <main className="flex-1 p-4 md:p-8 space-y-3">
          <p>No active program loaded yet.</p>
          <Link
            href="/catalog"
            className="btn-primary inline-block px-4 py-2.5 text-sm min-h-[44px]"
          >
            Browse the Program Catalog
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{programName}</h1>
          <p className="text-sm opacity-60">{versionLabel}</p>
        </div>

        {weeks.map((week) => (
          <section key={week.id} className="card p-4 space-y-2">
            <h2 className="font-semibold">{week.label}</h2>

            {workouts
              .filter((w) => w.program_week_id === week.id)
              .sort((a, b) => a.day_number - b.day_number)
              .map((w, idx, arr) => {
                const done = completedIds.has(w.id);
                return (
                  <div key={w.id} className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveWorkout(week.id, w.id, "up")}
                        disabled={idx === 0}
                        className={`px-2 py-1 rounded-card border border-white/10 text-xs ${
                          idx === 0 ? "opacity-20" : "opacity-80"
                        }`}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveWorkout(week.id, w.id, "down")}
                        disabled={idx === arr.length - 1}
                        className={`px-2 py-1 rounded-card border border-white/10 text-xs ${
                          idx === arr.length - 1 ? "opacity-20" : "opacity-80"
                        }`}
                      >
                        ▼
                      </button>
                    </div>
                    <Link
                      href={`/program/${w.id}`}
                      className="flex-1 flex justify-between items-center px-3 py-2 rounded-card border border-white/10 text-sm"
                    >
                      <span>{w.title}</span>
                      <span className={done ? "text-success" : "opacity-40"}>
                        {done ? "✓ Done" : "Not yet"}
                      </span>
                    </Link>
                    {confirmDeleteId === w.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteWorkout(w.id)}
                          className="px-2 py-2 rounded-card border border-error/40 text-error text-xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-2.5 rounded-card border border-white/10 text-sm min-h-[44px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(w.id)}
                        className="px-2 py-2 rounded-card border border-error/40 text-error text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}

            {addingToWeek === week.id ? (
              <div className="space-y-2 pt-2">
                <input
                  placeholder="Workout title (e.g. Full Body, Peloton Ride, Rest Day)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5 text-sm min-h-[44px]"
                />
                <input
                  placeholder="Notes (optional)"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-card px-3 py-2.5 text-sm min-h-[44px]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => addWorkout(week.id)}
                    className="btn-primary flex-1 py-2.5 text-sm min-h-[44px]"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAddingToWeek(null);
                      setNewTitle("");
                      setNewNotes("");
                    }}
                    className="flex-1 py-2 rounded-card border border-white/10 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingToWeek(week.id)}
                className="w-full py-2 rounded-card border border-primary/40 text-primary text-sm"
              >
                + Add a Workout to This Week
              </button>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
