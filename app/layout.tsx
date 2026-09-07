import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { PlannerProvider } from "@/lib/planner-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dương Study Planner",
    template: "%s · Dương Study Planner",
  },
  description:
    "Digital planner cá nhân cho Nguyễn Ngọc Thùy Dương: lập kế hoạch, ghi chú, ôn bài, làm bài thi và học tiếng Trung.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2f7fc4" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1a2b" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Patrick+Hand&family=Quicksand:wght@500;600;700&display=swap"
        />
      </head>
      <body>
        <PlannerProvider>
          <AppShell>{children}</AppShell>
        </PlannerProvider>
      </body>
    </html>
  );
}
