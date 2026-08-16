import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import TodayLabel from "@/components/TodayLabel";
import Link from "next/link";

type ProgramWorkout = {
  id: string;
  day_number: number;
  title: string;
  notes: string | null;
  program_week_id: string;
};

async function getNextWorkout(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!program) return null;

  const { data: version } = await supabase
    .from("program_versions")
    .select("id, label")
    .eq("program_id", program.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!version) return null;

  const { data: weeks } = await supabase
    .from("program_weeks")
    .select("id, week_number")
    .eq("program_version_id", version.id)
    .order("week_number");
  if (!weeks || weeks.length === 0) return null;

  const weekIds = weeks.map((w) => w.id);
  const weekNumberById = new Map(weeks.map((w) => [w.id, w.week_number]));

  const { data: workouts } = await supabase
    .from("program_workouts")
    .select("id, day_number, title, notes, program_week_id")
    .in("program_week_id", weekIds);
  if (!workouts || workouts.length === 0) return null;

  const ordered = (workouts as ProgramWorkout[]).sort((a, b) => {
    const weekA = weekNumberById.get(a.program_week_id) ?? 0;
    const weekB = weekNumberById.get(b.program_week_id) ?? 0;
    if (weekA !== weekB) return weekA - weekB;
    return a.day_number - b.day_number;
  });

  const { data: completedSessions } = await supabase
    .from("workout_sessions")
    .select("program_workout_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("program_workout_id", "is", null);

  const completedIds = new Set(
    (completedSessions ?? []).map((s) => s.program_workout_id)
  );

  const next = ordered.find((w) => !completedIds.has(w.id)) ?? null;

  return {
    versionLabel: version.label as string,
    totalSessions: ordered.length,
    completedCount: completedIds.size,
    nextWorkout: next,
    nextWeekNumber: next ? weekNumberById.get(next.program_week_id) : null,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: latestWeight }, { data: recentSession }, programStatus] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("body_measurements")
        .select("weight_lb, logged_date")
        .eq("user_id", user!.id)
        .order("logged_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("workout_sessions")
        .select("id, status, started_at, completed_at")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      getNextWorkout(supabase, user!.id),
    ]);

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-1">Today</h1>
        <TodayLabel />

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-xs opacity-60">Current Weight</p>
            <p className="text-xl font-bold">
              {latestWeight?.weight_lb ? `${latestWeight.weight_lb} lb` : "—"}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs opacity-60">Target Weight</p>
            <p className="text-xl font-bold">
              {profile?.target_weight_lb ? `${profile.target_weight_lb} lb` : "—"}
            </p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <p className="text-xs opacity-60 mb-1">Today's Workout</p>

          {!programStatus ? (
            <>
              <p className="font-semibold mb-3">
                No program loaded yet — browse the catalog to get started.
              </p>
              <Link href="/catalog" className="btn-primary inline-block px-4 py-2 text-sm mr-2">
                Browse Programs
              </Link>
              <Link
                href="/train"
                className="inline-block px-4 py-2 text-sm rounded-card border border-white/10 opacity-90"
              >
                Log a Workout
              </Link>
            </>
          ) : !programStatus.nextWorkout ? (
            <>
              <p className="font-semibold mb-1">
                {programStatus.versionLabel} — complete! 🎉
              </p>
              <p className="text-sm opacity-60 mb-3">
                All {programStatus.totalSessions} sessions done. Time to talk about
                Version 2 or move into Phase 2.
              </p>
              <Link href="/train" className="btn-primary inline-block px-4 py-2 text-sm">
                Log an Extra Workout
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs opacity-60 mb-1">
                {programStatus.versionLabel} · Week {programStatus.nextWeekNumber}
              </p>
              <p className="font-semibold mb-1">{programStatus.nextWorkout.title}</p>
              {programStatus.nextWorkout.notes && (
                <p className="text-sm opacity-60 mb-3">
                  {programStatus.nextWorkout.notes}
                </p>
              )}
              <p className="text-xs opacity-50 mb-3">
                {programStatus.completedCount} of {programStatus.totalSessions} sessions
                complete
              </p>
              <Link
                href={`/train?workout=${programStatus.nextWorkout.id}`}
                className="btn-primary inline-block px-4 py-2 text-sm mr-2"
              >
                Start This Workout
              </Link>
              <Link
                href="/program"
                className="inline-block px-4 py-2 text-sm rounded-card border border-white/10 opacity-90"
              >
                Preview Full Program
              </Link>
            </>
          )}
        </div>

        <div className="card p-4">
          <p className="text-xs opacity-60 mb-1">Last Session</p>
          {recentSession ? (
            <p className="text-sm">
              {recentSession.status} —{" "}
              {new Date(recentSession.started_at).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm opacity-60">No workouts logged yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
