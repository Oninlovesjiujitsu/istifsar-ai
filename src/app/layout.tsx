import type { Metadata } from "next";
import { Geist_Mono, Figtree, Playfair_Display, Noto_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/src/lib/utils";
import { ThemeProvider } from "@/src/components/providers/ThemeProvider";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['700', '900'],
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Istifsar AI — The Illuminated Archivist",
  description: "Explore history through verified scholarly sources. Every answer grounded in the published writings of academic historians.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        figtree.variable,
        playfairDisplay.variable,
        notoSerif.variable,
        geistMono.variable,
        "font-sans",
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>{children}</ThemeProvider>
      </body>
    </html>
  );
}
