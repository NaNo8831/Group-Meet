import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Group Meet",
  description: "Coordinate team availability for participant meeting requests."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
