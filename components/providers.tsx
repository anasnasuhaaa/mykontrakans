"use client";

import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { NavigationToast } from "@/components/navigation-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    {children}
    <Suspense fallback={null}><NavigationToast /></Suspense>
    <Toaster position="top-right" duration={1500} closeButton={false} richColors />
  </ThemeProvider>;
}
