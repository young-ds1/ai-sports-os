'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    dau: number;
    ai_requests_per_dau: number;
    total_ai_requests: number;
    estimated_daily_cost: number;
    estimated_monthly_cost: number;
  };
  top_matches: Array<{ entity_id: string; views: number }>;
  health: {
    cost_status: 'green' | 'yellow' | 'red';
    cache_hit_rate: number | null;
    avg_latency_ms: number | null;
    rate_limit_breaches: number;
  };
}

interface NorthStarData {
  data: Array<{ date: string; ai_requests_per_dau: number; dau: number }>;
}

interface CostsData {
  today_total: number;
  estimated_monthly: number;
  per_user_avg: number;
  model_breakdown: Record<string, number>;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchJson(path: string) {
  const res = await fetch(`${API}${path}`);
  const json = await res.json();
  return json.data ?? json;
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [northStar, setNorthStar] = useState<NorthStarData | null>(null);
  const [costs, setCosts] = useState<CostsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJson('/api/admin/analytics/dashboard'),
      fetchJson('/api/admin/analytics/north-star?days=7'),
      fetchJson('/api/admin/analytics/costs'),
    ]).then(([d, n, c]) => {
      setDashboard(d);
      setNorthStar(n);
      setCosts(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">📊 Admin Dashboard</h1>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const costColor = dashboard?.health?.cost_status === 'green' ? 'text-green-600'
    : dashboard?.health?.cost_status === 'yellow' ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-primary-600">← 返回首页</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="DAU" value={dashboard?.metrics?.dau || 0} />
        <KpiCard label="AI Requests / DAU" value={(dashboard?.metrics?.ai_requests_per_dau || 0).toFixed(1)} highlight />
        <KpiCard label="Daily Cost" value={`$${(dashboard?.metrics?.estimated_daily_cost || 0).toFixed(2)}`} className={costColor} />
        <KpiCard label="Monthly Est." value={`$${(dashboard?.metrics?.estimated_monthly_cost || 0).toFixed(0)}`} />
      </div>

      {/* North Star Chart */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold mb-3">🧭 North Star: AI Requests Per DAU (7 days)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">DAU</th>
                <th className="pb-2 pr-4">AI Requests/DAU</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(northStar?.data || []).map(row => {
                const status = row.ai_requests_per_dau >= 2 ? '🔥'
                  : row.ai_requests_per_dau >= 1 ? '✅'
                  : row.ai_requests_per_dau >= 0.5 ? '⚠️'
                  : '❌';
                return (
                  <tr key={row.date} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-mono">{row.date}</td>
                    <td className="py-2 pr-4">{row.dau}</td>
                    <td className="py-2 pr-4 font-mono font-bold">{row.ai_requests_per_dau.toFixed(1)}</td>
                    <td className="py-2">{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-2 text-xs text-gray-500">
          <span>🔥 &ge;2.0 Strong</span>
          <span>✅ &ge;1.0 Validated</span>
          <span>⚠️ &ge;0.5 Observe</span>
          <span>❌ &lt;0.5 Fail</span>
        </div>
      </div>

      {/* Cost + Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <h2 className="font-bold mb-3">💰 AI Costs</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Today</span>
              <span className="font-mono font-bold">${(costs?.today_total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Monthly estimate</span>
              <span className="font-mono font-bold">${(costs?.estimated_monthly || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Per user avg</span>
              <span className="font-mono">${(costs?.per_user_avg || 0).toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Model breakdown</span>
              <span className="font-mono text-xs">
                {costs?.model_breakdown && Object.entries(costs.model_breakdown).map(([k, v]) => `${k}: $${Number(v).toFixed(2)}`).join(' | ')}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-bold mb-3">🫀 System Health</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Cost status</span>
              <span className={`font-bold ${costColor}`}>
                {dashboard?.health?.cost_status?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rate limit breaches</span>
              <span className="font-mono">{dashboard?.health?.rate_limit_breaches || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cache hit rate</span>
              <span className="font-mono">{dashboard?.health?.cache_hit_rate ? `${(dashboard.health.cache_hit_rate * 100).toFixed(0)}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Avg latency</span>
              <span className="font-mono">{dashboard?.health?.avg_latency_ms ? `${dashboard.health.avg_latency_ms}ms` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Matches */}
      <div className="card p-4">
        <h2 className="font-bold mb-3">🏆 Top Matches by Views</h2>
        <div className="space-y-2 text-sm">
          {(dashboard?.top_matches || []).slice(0, 5).map((m, i) => (
            <div key={m.entity_id} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
              <span>{i + 1}. {m.entity_id}</span>
              <span className="font-mono">{m.views} views</span>
            </div>
          ))}
          {(!dashboard?.top_matches || dashboard.top_matches.length === 0) && (
            <p className="text-gray-400 text-sm">暂无数据</p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        AI Sports OS Admin · Data refreshes on page load
      </p>
    </div>
  );
}

function KpiCard({ label, value, highlight, className }: {
  label: string; value: string | number; highlight?: boolean; className?: string;
}) {
  return (
    <div className={`card p-4 ${highlight ? 'border-primary-200 bg-primary-50' : ''}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${className || ''}`}>{value}</div>
    </div>
  );
}
