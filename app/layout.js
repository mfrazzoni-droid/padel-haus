import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SupabaseInit from "@/components/SupabaseInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Padel Haus",
  description: "Ligas, partidos y ranking de pádel",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f1a14] text-zinc-50">
        <SupabaseInit />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
