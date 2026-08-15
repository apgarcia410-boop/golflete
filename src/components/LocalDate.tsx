"use client";

import { useEffect, useState } from "react";

export default function LocalDate({
  iso,
  options,
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(new Date(iso).toLocaleDateString(undefined, options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  return <>{label}</>;
}
