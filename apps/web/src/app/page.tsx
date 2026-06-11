import { fetchMatches } from '@/lib/api-client';
import { MatchCard } from '@/components/match/match-card';

export default async function HomePage() {
  let matches: any[] = [];
  let error: string | null = null;

  try {
    matches = await fetchMatches();
  } catch {
    error = '无法加载比赛数据';
  }

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">🏆 FIFA World Cup 2026</h1>
        <p className="text-gray-500">AI 驱动的赛事情报平台</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        <button className="px-3 py-1.5 text-sm font-medium text-primary-600 border-b-2 border-primary-600">
          今日赛事
        </button>
        <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
          即将进行
        </button>
        <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
          进行中
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg mb-2">⚠️ {error}</p>
          <p className="text-sm">请确保后端服务已启动 (http://localhost:3001)</p>
        </div>
      )}

      {/* Match list */}
      {!error && matches.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg mb-2">📅 今日暂无比赛</p>
          <p className="text-sm">请检查种子数据是否已导入</p>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
