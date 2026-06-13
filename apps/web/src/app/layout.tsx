import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: '2026世界杯 AI 预测',
  description: 'AI驱动的世界杯比赛预测平台，实时比分 + 概率分析',
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
