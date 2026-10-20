import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { loadCatalog } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/dal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ThemeSet — Build your perfect CS2 style",
  description: "Discover, match, create and share CS2 skin sets built around your style.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [catalog, user] = await Promise.all([loadCatalog(), getCurrentUser()]);

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-bg text-ink font-sans">
        <ThemeProvider>
          <Header
            catalogSource={catalog.source}
            catalogNote={catalog.note}
            user={user && { username: user.username, avatarUrl: user.avatarUrl }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
