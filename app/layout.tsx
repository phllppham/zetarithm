import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import { AuthModalProvider } from "@/contexts/AuthModalContext";

export const metadata: Metadata = {
  title: "Zetarithm — Modern Zetamac Arithmetic Game",
  description: "Modern Zetamac Arithmetic Game",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white">
        <AuthModalProvider>
          <BackgroundOrbs />
          <Navbar />
          <main>{children}</main>
        </AuthModalProvider>
      </body>
    </html>
  );
}
