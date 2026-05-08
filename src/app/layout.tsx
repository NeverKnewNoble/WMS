import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for the Joshob wordmark — heavy industrial sans that mirrors
// the squared, weighty letterforms of the original printed logo.
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Joshob Construction — Operations Portal",
  description:
    "Inventory, stock movement, and site logistics for Joshob Construction Co. Ltd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          richColors
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-white/10 bg-zinc-900 text-white shadow-lg shadow-black/40 ring-1 ring-inset ring-white/5",
              description: "text-white/95",
            },
          }}
        />
      </body>
    </html>
  );
}
