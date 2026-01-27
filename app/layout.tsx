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
  metadataBase: new URL("https://mechtaai.ru"),
  title: "MechtaAI — личный кабинет",
  description: "Личный кабинет MechtaAI. Доступ только для авторизованных пользователей.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
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
