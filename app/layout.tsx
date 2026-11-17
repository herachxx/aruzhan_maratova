import type { Metadata } from "next";
import "./globals.css";
import MusicProvider from "@/components/MusicProvider";

export const metadata: Metadata = {
  title: "Aruzhan Maratova",
  description:
    "Hi, I’m Aruzhan. I’m a student in Aktobe, Kazakhstan, working on cybersecurity, software and robotics. Explore my projects or open my CV.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MusicProvider>{children}</MusicProvider>
      </body>
    </html>
  );
}
