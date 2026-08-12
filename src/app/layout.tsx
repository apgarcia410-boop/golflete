import type { Metadata, Viewport } from "next";
import "./globals.css";
import BrandThemeProvider from "@/components/BrandThemeProvider";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  let appleIcon = "/icons/icon-192.png";

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("brand_settings")
        .select("app_icon_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.app_icon_url) appleIcon = data.app_icon_url;
    }
  } catch {
    // Fall back to the default icon below if anything here fails —
    // a broken icon lookup should never break the whole app.
  }

  return {
    title: "Golf Athlete App",
    description: "Personal golf-athlete performance lab",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Golf Athlete",
    },
    icons: {
      apple: appleIcon,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f1113",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BrandThemeProvider>{children}</BrandThemeProvider>
      </body>
    </html>
  );
}
