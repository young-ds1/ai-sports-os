import Link from 'next/link';
import { fetchTeam } from '@/lib/api-client';

export default async function TeamPage({ params }: { params: { id: string } }) {
  let team: any;
  try { team = await fetchTeam(params.id); } catch { return <ErrorView />; }
  if (!team || team.error) return <ErrorView />;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span>/</span>
        <span>{team.name}</span>
      </div>

      {/* Hero */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
            {team.short_name?.[0] || '⚽'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.name_zh && <p className="text-gray-500">{team.name_zh}</p>}
            <div className="flex gap-3 mt-2 text-sm text-gray-600">
              {team.country && <span>🇺🇳 {team.country}</span>}
              {team.coach && <span>👔 {team.coach}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Recent matches */}
      {team.recent_matches && team.recent_matches.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold mb-3">📊 近期赛果</h2>
          <div className="space-y-2">
            {team.recent_matches.map((m: any) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>{m.home_team?.short_name || '?'}</span>
                  <span className="font-mono font-bold">
                    {m.home_score ?? '-'} - {m.away_score ?? '-'}
                  </span>
                  <span>{m.away_team?.short_name || '?'}</span>
                </div>
                <span className="text-xs text-gray-400">{m.match_date}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI CTA */}
      <div className="mt-6">
        <Link href={`/chat?teamId=${team.id}`} className="btn-primary w-full text-center">
          💬 问 AI 关于 {team.name}
        </Link>
      </div>
    </div>
  );
}

function ErrorView() {
  return (
    <div className="card p-8 text-center">
      <p className="text-gray-500">球队未找到</p>
      <Link href="/" className="btn-primary mt-4 inline-block">返回首页</Link>
    </div>
  );
}
