'use client';

import Link from 'next/link';
import { MessageCircle, User } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">⚽</span>
          <span className="text-gray-900 font-bold">
            2026世界杯 AI 预测
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/chat" className="btn-ghost text-sm gap-1">
            <MessageCircle size={16} />
            <span className="hidden sm:inline">AI问答</span>
          </Link>
          <Link href="/user" className="btn-ghost text-sm gap-1">
            <User size={16} />
            <span className="hidden sm:inline">我的</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
