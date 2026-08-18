import type { Metadata } from "next";
import Provider from "@/lib/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mess Price Tracker",
  description: "For the Prices you eat!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
