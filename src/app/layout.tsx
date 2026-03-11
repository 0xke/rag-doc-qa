import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocMind AI — Intelligent Document Q&A",
  description: "Upload documents and ask questions powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg-primary text-text-primary">
        {children}
      </body>
    </html>
  );
}
