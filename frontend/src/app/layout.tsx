import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARYNOX AI HIRE — AI-Powered Technical Hiring",
  description: "Evaluate technical candidates with AI interviews, live voice interaction, 3D AI interviewer, GitHub project verification, and company-specific RAG.",
  keywords: ["AI hiring", "technical interview", "candidate evaluation", "GitHub verification", "AI interviewer", "Indian languages"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
