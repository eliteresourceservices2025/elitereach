import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EliteReach — Elite Resource Services",
  description: "Email Marketing Tool made exclusively for Elite Resource Services",
  icons: {
    icon: "/elite-logo-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-elite-bg">{children}</body>
    </html>
  );
}
