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
      <body className="min-h-full flex flex-col relative">
        {/* Global SVG Noise Overlay */}
        <div 
          className="pointer-events-none fixed inset-0 z-50 mix-blend-multiply opacity-[0.4]"
          style={{ 
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" 
          }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="archive" enableSystem={false}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
