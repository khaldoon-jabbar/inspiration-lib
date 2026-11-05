import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inspiration Lib",
  description:
    "A personal library of screenshots and links, sorted into aesthetic families with an image prompt and a site brief.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
