import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import Providers from "./providers";
import { Toaster } from 'sonner';
const inter = Inter({
  subsets: ["latin", "cyrillic"], 
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MechtaAI - Telegram Login",
  description: "Login with Telegram QR Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} antialiased font-sans`} 
        style={{ fontFamily: 'var(--font-inter)' }} 
      >
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors 
          toastOptions={{
            style: {
              background: 'rgba(26, 26, 26, 0.8)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
            },
            className: 'glass',
          }}
        />
      </body>
    </html>
  );
}