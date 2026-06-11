import Link from 'next/link';
import { fetchMatch } from '@/lib/api-client';
import { MatchHeader } from '@/components/match/match-header';
import { MatchEvents } from '@/components/match/match-events';

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  let match: any;
  let error: string | null = null;

  try {
    match = await fetchMatch(params.id);
  } catch {
    error = '无法加载比赛数据';
  }

  if (error || !match) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg text-gray-500">⚠️ {error || '比赛未找到'}</p>
        <Link href="/" className="btn-primary mt-4 inline-block">返回首页</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span>/</span>
        <span>{match.competition?.name || '赛事'}</span>
      </div>

      {/* Match Header */}
      <MatchHeader match={match} />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mt-6 mb-4">
        <span className="px-2 py-2 text-sm font-medium text-primary-600 border-b-2 border-primary-600">
          比赛信息
        </span>
        <Link
          href={`/matches/${match.id}/analysis`}
          className="px-2 py-2 text-sm text-gray-500 hover:text-primary-600"
        >
          🤖 AI 分析
        </Link>
      </div>

      {/* Match Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <InfoCard label="比赛状态" value={match.status === 'live' ? '🔴 进行中' : match.status === 'finished' ? '✅ 已结束' : '📅 未开始'} />
        <InfoCard label="比赛日期" value={match.match_date} />
        <InfoCard label="开球时间" value={match.kickoff_time?.substring(0, 5) || 'TBD'} />
        <InfoCard label="阶段" value={match.round || match.group_name || '-'} />
        <InfoCard label="球场" value={match.venue || '-'} />
        <InfoCard label="裁判" value={match.referee || '-'} />
      </div>

      {/* Events timeline */}
      {match.events && match.events.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">⚽ 比赛事件</h3>
          <MatchEvents events={match.events} />
        </div>
      )}

      {/* AI Analysis CTA */}
      <div className="mt-6">
        <Link
          href={`/matches/${match.id}/analysis`}
          className="btn-primary w-full text-center text-lg py-3"
        >
          🤖 查看 AI 赛事分析
        </Link>
      </div>
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
