import type { Metadata, Viewport } from "next";
import "./globals.css";
import BrandThemeProvider from "@/components/BrandThemeProvider";

export const metadata: Metadata = {
  title: "Golf Athlete App",
  description: "Personal golf-athlete performance lab",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Golf Athlete",
  },
};

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
