import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider"
import "./globals.css";

export const metadata: Metadata = {
  title: "D&D Soundboard",
  description: "Tablero de sonidos para TTRPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
        >
        {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
