import Link from 'next/link';
import { fetchAiAnalysis } from '@/lib/api-client';
import { AnalysisReport } from '@/components/ai/analysis-report';

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  let analysis: any;
  let error: string | null = null;

  try {
    analysis = await fetchAiAnalysis(params.id);
  } catch {
    error = '无法加载 AI 分析';
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">首页</Link>
        <span>/</span>
        <Link href={`/matches/${params.id}`} className="hover:text-primary-600">比赛详情</Link>
        <span>/</span>
        <span className="text-primary-600">AI 分析</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h1 className="text-xl font-bold">AI 赛事分析</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">⚠️ {error}</p>
          <Link href={`/matches/${params.id}`} className="btn-ghost">返回比赛</Link>
        </div>
      )}

      {/* Loading state (no analysis yet) */}
      {!error && !analysis && (
        <div className="card p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
          </div>
          <p className="text-gray-500 mt-4">AI 分析生成中...</p>
          <p className="text-xs text-gray-400 mt-2">首次分析需要 10-15 秒</p>
        </div>
      )}

      {/* Analysis content */}
      {analysis && <AnalysisReport data={analysis.data || analysis} />}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link href={`/matches/${params.id}`} className="btn-ghost flex-1 text-center">
          ← 返回比赛
        </Link>
        <Link href={`/chat?matchId=${params.id}`} className="btn-primary flex-1 text-center">
          💬 追问 AI
        </Link>
      </div>
    </div>
  );
}
