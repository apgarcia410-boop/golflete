"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";

type Template = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  activeVersionId: string;
};

export default function CatalogPage() {
  const supabase = createClient();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name, category, description")
      .eq("is_template", true)
      .order("name");

    if (!programs || programs.length === 0) {
      setTemplates([]);
      setLoaded(true);
      return;
    }

    const programIds = programs.map((p) => p.id);
    const { data: versions } = await supabase
      .from("program_versions")
      .select("id, program_id")
      .in("program_id", programIds)
      .eq("is_active", true);

    const versionByProgram = new Map((versions ?? []).map((v) => [v.program_id, v.id]));

    setTemplates(
      programs
        .filter((p) => versionByProgram.has(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          activeVersionId: versionByProgram.get(p.id)!,
        }))
    );
    setLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectProgram(versionId: string) {
    setSelecting(versionId);
    setError(null);

    const { error: rpcError } = await supabase.rpc("clone_program_for_user", {
      p_template_version_id: versionId,
    });

    setSelecting(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.push("/program");
  }

  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Program Catalog</h1>
          <p className="text-sm opacity-60">
            Pick a program to start following. You'll get your own personal copy —
            free to log, adjust, and add to, without affecting anyone else.
          </p>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        {!loaded ? (
          <p className="text-sm opacity-60">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm opacity-50">No programs available yet.</p>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="card p-4 space-y-2">
              <div>
                <p className="font-semibold">{t.name}</p>
                {t.category && (
                  <p className="text-xs text-primary">{t.category}</p>
                )}
              </div>
              {t.description && (
                <p className="text-sm opacity-70">{t.description}</p>
              )}
              <button
                onClick={() => selectProgram(t.activeVersionId)}
                disabled={selecting === t.activeVersionId}
                className="btn-primary w-full py-2"
              >
                {selecting === t.activeVersionId
                  ? "Setting up your copy…"
                  : "Select This Program"}
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
