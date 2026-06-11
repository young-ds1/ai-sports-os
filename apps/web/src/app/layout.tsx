import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'AI Sports OS',
  description: 'AI-driven global sports intelligence platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
