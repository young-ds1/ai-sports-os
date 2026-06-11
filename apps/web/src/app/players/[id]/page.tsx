import Link from 'next/link';
import { fetchPlayer } from '@/lib/api-client';

export default async function PlayerPage({ params }: { params: { id: string } }) {
  let player: any;
  try { player = await fetchPlayer(params.id); } catch { return <ErrorView />; }
  if (!player || player.error) return <ErrorView />;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span>/</span>
        <span>{player.name}</span>
      </div>

      {/* Hero */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center text-3xl">
            🧑
          </div>
          <div>
            <h1 className="text-2xl font-bold">{player.name}</h1>
            {player.name_zh && <p className="text-gray-500">{player.name_zh}</p>}
            <div className="flex gap-3 mt-2 text-sm text-gray-600">
              {player.position && <span>📍 {player.position}</span>}
              {player.nationality && <span>🌍 {player.nationality}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <InfoCard label="位置" value={player.position || '-'} />
        <InfoCard label="国籍" value={player.nationality || '-'} />
        <InfoCard label="出生日期" value={player.birth_date || '-'} />
        <InfoCard label="惯用脚" value={player.preferred_foot || '-'} />
      </div>

      {/* Recent events */}
      {player.recent_events && player.recent_events.length > 0 && (
        <div className="card p-4 mb-6">
          <h2 className="font-bold mb-3">📋 近期表现</h2>
          <div className="space-y-1">
            {player.recent_events.map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                <span className="font-mono text-gray-500 w-8">{e.minute}&apos;</span>
                <span>{e.type === 'goal' ? '⚽' : '📌'}</span>
                <span>{e.comment || e.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href={`/chat?playerId=${player.id}`} className="btn-primary w-full text-center block">
        💬 问 AI 关于 {player.name}
      </Link>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function ErrorView() {
  return (
    <div className="card p-8 text-center">
      <p className="text-gray-500">球员未找到</p>
      <Link href="/" className="btn-primary mt-4 inline-block">返回首页</Link>
    </div>
  );
}
