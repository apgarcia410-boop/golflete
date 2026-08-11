import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default async function ProgramPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: program } = await supabase
    .from("programs")
    .select("id, name")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  if (!program) {
    return (
      <div className="md:flex min-h-screen">
        <NavBar />
        <main className="flex-1 p-4 md:p-8">No program loaded yet.</main>
      </div>
    );
  }

  const { data: version } = await supabase
    .from("program_versions")
    .select("id, label")
    .eq("program_id", program.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!version) {
    return (
      <div className="md:flex min-h-screen">
        <NavBar />
        <main className="flex-1 p-4 md:p-8">No active program version.</main>
      </div>
    );
  }

  const { data: weeks } = await supabase
    .from("program_weeks")
    .select("id, week_number, label")
    .eq("program_version_id", version.id)
    .order("week_number");

  const weekIds = (weeks ?? []).map((w) => w.id);

  const { data: workouts } = await supabase
    .from("program_workouts")
    .select("id, day_number, title, program_week_id")
    .in("program_week_id", weekIds.length > 0 ? weekIds : [""])
    .order("day_number");

  const { data: completedSessions } = await supabase
    .from("workout_sessions")
    .select("program_workout_id")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .not("program_workout_id", "is", null);

  const completedIds = new Set((completedSessions ?? []).map((s) => s.program_workout_id));

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <p className="text-sm opacity-60">{version.label}</p>
        </div>

        {(weeks ?? []).map((week) => (
          <section key={week.id} className="card p-4 space-y-2">
            <h2 className="font-semibold">{week.label}</h2>
            {(workouts ?? [])
              .filter((w) => w.program_week_id === week.id)
              .map((w) => {
                const done = completedIds.has(w.id);
                return (
                  <Link
                    key={w.id}
                    href={`/program/${w.id}`}
                    className="flex justify-between items-center px-3 py-2 rounded-card border border-white/10 text-sm"
                  >
                    <span>{w.title}</span>
                    <span className={done ? "text-success" : "opacity-40"}>
                      {done ? "✓ Done" : "Not yet"}
                    </span>
                  </Link>
                );
              })}
          </section>
        ))}
      </main>
    </div>
  );
}
