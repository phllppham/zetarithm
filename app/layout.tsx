import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BackgroundOrbs from "@/components/BackgroundOrbs";

export const metadata: Metadata = {
  title: "ZetaMath — Mental Arithmetic Speed Game",
  description: "Test your mental arithmetic speed. How many problems can you solve in 60 seconds?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white">
        <BackgroundOrbs />
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
