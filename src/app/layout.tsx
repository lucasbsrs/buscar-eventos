import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Toast } from "@base-ui/react/toast";
import { Toaster } from "@/components/Toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Eventaku - Encontre eventos geek, anime e nerd",
  description: "O maior agregador de eventos otaku, geek e nerd do Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Toast.Provider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            Eventaku © {new Date().getFullYear()}
          </footer>
          <Toaster />
        </Toast.Provider>
      </body>
    </html>
  );
}
