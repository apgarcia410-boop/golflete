import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default async function ProgramWorkoutPreviewPage({
  params,
}: {
  params: { workoutId: string };
}) {
  const supabase = createClient();

  const { data: workout } = await supabase
    .from("program_workouts")
    .select("title, notes")
    .eq("id", params.workoutId)
    .single();

  const { data: exercises } = await supabase
    .from("program_exercises")
    .select("id, exercise_id, order_index, target_sets, target_reps, target_rpe, notes")
    .eq("program_workout_id", params.workoutId)
    .order("order_index");

  let exerciseNames = new Map<string, string>();
  if (exercises && exercises.length > 0) {
    const ids = Array.from(new Set(exercises.map((e) => e.exercise_id)));
    const { data: names } = await supabase
      .from("exercise_library")
      .select("id, name")
      .in("id", ids);
    exerciseNames = new Map((names ?? []).map((n) => [n.id, n.name]));
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <Link href="/program" className="text-sm opacity-60 underline">
            ← Back to Program
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{workout?.title ?? "Workout"}</h1>
          {workout?.notes && <p className="text-sm opacity-60 mt-1">{workout.notes}</p>}
        </div>

        <section className="card p-4 space-y-2">
          {(exercises ?? []).map((ex) => (
            <div key={ex.id} className="border-b border-white/10 last:border-0 pb-2 last:pb-0">
              <p className="text-sm font-medium">
                {exerciseNames.get(ex.exercise_id) ?? "Unknown exercise"}
              </p>
              <p className="text-xs opacity-60">
                {ex.target_sets
                  ? ex.target_reps
                    ? `${ex.target_sets} × ${ex.target_reps}`
                    : `${ex.target_sets} sets`
                  : ""}
                {ex.target_rpe ? ` @ RPE ${ex.target_rpe}` : ""}
              </p>
              {ex.notes && <p className="text-xs opacity-50">{ex.notes}</p>}
            </div>
          ))}
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
