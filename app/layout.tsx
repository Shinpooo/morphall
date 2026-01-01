import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ContextProvider from "../context";
import AppHeader from "../components/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "morphall",
  description: "Morpho vaults interface",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ContextProvider cookies={cookies}>
          <div className="relative min-h-screen overflow-hidden bg-[#0c0d0f] text-zinc-100">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-32 top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(228,114,141,0.18),_transparent_65%)] blur-3xl" />
              <div className="absolute right-[-10rem] top-[18rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(73,114,255,0.16),_transparent_70%)] blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
            </div>
            <AppHeader />
            <div className="relative">{children}</div>
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}
