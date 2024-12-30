import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientNavigation from "../components/ClientNavigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reading Intensive - PTE Practice",
  description: "Practice PTE Reading Fill in the Blanks questions with instant translations and visual aids",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="h-full flex flex-col">
          <ClientNavigation />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
