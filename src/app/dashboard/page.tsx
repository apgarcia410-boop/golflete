import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: latestWeight }, { data: recentSession }] =
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
    ]);

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-24 md:pb-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-1">Today</h1>
        <p className="opacity-60 text-sm mb-6">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

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
          <p className="font-semibold mb-3">
            No program loaded yet — the 6-week program needs to be added.
          </p>
          <Link href="/train" className="btn-primary inline-block px-4 py-2 text-sm">
            Log a Workout
          </Link>
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
