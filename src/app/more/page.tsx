import NavBar from "@/components/NavBar";
import Link from "next/link";

export default function MorePage() {
  return (
    <div className="md:flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 pb-36 md:pb-4 md:p-8 max-w-2xl space-y-3">
        <h1 className="text-2xl font-bold mb-2">More</h1>

        <Link href="/profile" className="block card p-4">
          <p className="font-semibold">Profile</p>
          <p className="text-sm opacity-60">Height, current weight, target weight, goals</p>
        </Link>

        <Link href="/brand" className="block card p-4">
          <p className="font-semibold">Brand & Appearance</p>
          <p className="text-sm opacity-60">Logo, colors, theme presets</p>
        </Link>

        <Link href="/exercise-library" className="block card p-4">
          <p className="font-semibold">Exercise Library</p>
          <p className="text-sm opacity-60">Add, edit, or remove exercises</p>
        </Link>
      </main>
    </div>
  );
}
