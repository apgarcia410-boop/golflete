import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: weights }, { data: sessions }] = await Promise.all([
    supabase
      .from("body_measurements")
      .select("logged_date, weight_lb, waist_in, body_fat_pct")
      .eq("user_id", user!.id)
      .order("logged_date", { ascending: false })
      .limit(10),
    supabase
      .from("workout_sessions")
      .select("id, status, started_at, completed_at, location")
      .eq("user_id", user!.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm opacity-60">
          Basic history for now — trend charts and PRs arrive in Phase 2.
        </p>

        <Link
          href="/program"
          className="block card p-4 text-sm text-primary underline"
        >
          Browse the full 6-week program →
        </Link>

        <section className="card p-4">
          <h2 className="font-semibold mb-3">Recent Body Stats</h2>
          {weights && weights.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {weights.map((w, i) => (
                <li key={i} className="flex justify-between">
                  <span className="opacity-60">{w.logged_date}</span>
                  <span>
                    {w.weight_lb ? `${w.weight_lb} lb` : "—"}
                    {w.body_fat_pct ? ` · ${w.body_fat_pct}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm opacity-50">No entries yet.</p>
          )}
        </section>

        <section className="card p-4">
          <h2 className="font-semibold mb-3">Recent Workouts</h2>
          {sessions && sessions.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/workout/${s.id}`}
                    className="flex justify-between hover:text-primary"
                  >
                    <span className="opacity-60">
                      {new Date(s.started_at).toLocaleDateString()}
                    </span>
                    <span>
                      {s.location ?? "—"} · {s.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm opacity-50">No workouts logged yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}
