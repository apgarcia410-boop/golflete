"use client";

import { useEffect, useState } from "react";

export default function TodayLabel() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Renders blank until mounted client-side, so we never show the
  // server's (UTC) date/day-of-week for a moment before correcting.
  return <p className="opacity-60 text-sm mb-6">{label}</p>;
}
