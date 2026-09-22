import type { Metadata } from "next";
import { VT323, Press_Start_2P, Share_Tech_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = VT323({
  variable: "--font-cove-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Share_Tech_Mono({
  variable: "--font-cove-body",
  subsets: ["latin"],
  weight: "400",
});

const mono = Share_Tech_Mono({
  variable: "--font-cove-mono",
  subsets: ["latin"],
  weight: "400",
});

const pixel = Press_Start_2P({
  variable: "--font-cove-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Cove — adult social forum",
  description:
    "Cove is an 18+ social forum for thoughtful connection. CRT-green, consent-forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${pixel.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cove-ink font-sans text-cove-mist">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
