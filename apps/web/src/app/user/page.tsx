'use client';

import { useState } from 'react';

export default function UserPage() {
  const [mockUser] = useState({ name: '球迷用户', tier: 'free', dailyLimit: 3 });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">👤 用户中心</h1>

      {/* Profile */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-green-200 flex items-center justify-center text-2xl">
            🧑
          </div>
          <div>
            <h2 className="font-bold text-lg">{mockUser.name}</h2>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {mockUser.tier === 'free' ? 'Free 会员' : mockUser.tier.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Usage */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">今日 AI 分析次数</span>
            <span className="text-sm font-mono font-bold">2 / {mockUser.dailyLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '66%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">还剩 1 次 · 每天 0:00 重置</p>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <a href="#" className="card p-4 flex items-center justify-between hover:bg-gray-50">
          <span className="text-sm">📋 历史分析记录</span>
          <span className="text-gray-400">→</span>
        </a>
        <a href="#" className="card p-4 flex items-center justify-between hover:bg-gray-50">
          <span className="text-sm">💬 历史问答记录</span>
          <span className="text-gray-400">→</span>
        </a>
        <a href="#" className="card p-4 flex items-center justify-between hover:bg-gray-50">
          <span className="text-sm">⭐ 升级 VIP</span>
          <span className="text-xs text-primary-600 font-medium">无限分析</span>
        </a>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center mt-8">
        AI Sports OS v0.1.0 · MVP Phase 1
      </p>
    </div>
  );
}
