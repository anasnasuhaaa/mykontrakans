import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "MyKontrakans", template: "%s · MyKontrakans" },
  description: "Kelola kas rumah dan kehidupan bersama, lebih tertata.",
  icons: {
    icon: [{ url: "/main-logo.png", type: "image/png", sizes: "1254x1254" }],
    apple: [{ url: "/main-logo.png", type: "image/png", sizes: "1254x1254" }],
  },
  openGraph: {
    title: "MyKontrakans",
    description: "Kelola kas rumah dan kehidupan bersama, lebih tertata.",
    siteName: "MyKontrakans",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/main-logo.png", width: 1254, height: 1254, alt: "Logo MyKontrakans" }],
  },
  twitter: {
    card: "summary",
    title: "MyKontrakans",
    description: "Kelola kas rumah dan kehidupan bersama, lebih tertata.",
    images: ["/main-logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
