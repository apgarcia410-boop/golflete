"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const VAR_MAP: Record<string, string> = {
  color_background: "--color-background",
  color_surface: "--color-surface",
  color_primary: "--color-primary",
  color_secondary: "--color-secondary",
  color_accent: "--color-accent",
  color_text: "--color-text",
  color_success: "--color-success",
  color_warning: "--color-warning",
  color_error: "--color-error",
  card_radius: "--radius-card",
};

export default function BrandThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const supabase = createClient();

    async function applyBrand() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("brand_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!data) return;

      const root = document.documentElement;
      for (const [column, cssVar] of Object.entries(VAR_MAP)) {
        const value = (data as Record<string, string>)[column];
        if (value) root.style.setProperty(cssVar, value);
      }
    }

    applyBrand();
  }, []);

  return <>{children}</>;
}
