import Link from "next/link";
import AccuracyBadge from "@/components/ai/accuracy-badge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getPredictions() {
  try {
    const res = await fetch(`${API}/api/predictions/all`, { cache: "no-store" });
    const json = await res.json();
    return json.data || json;
  } catch {
    return [];
  }
}

async function getTournament() {
  try {
    const res = await fetch(`${API}/api/predictions/tournament`, { cache: "no-store" });
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const predictions = await getPredictions();
  const tournament = await getTournament();

  return (
    <div>
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">🏆 AI World Cup Predictions</h1>
        <p className="text-gray-500 text-sm">基于 Elo 评分、FIFA 排名、近期状态的实时预测</p>
      </div>

      {/* Accuracy Badge */}
      <AccuracyBadge />

      {/* Tournament Winner Ranking */}
      {tournament?.winnerProbs && (
        <div className="card p-4 mb-4">
          <h2 className="font-bold text-sm mb-3">👑 夺冠概率 Top 8</h2>
          <div className="space-y-2">
            {tournament.winnerProbs.map((t: any, i: number) => (
              <div key={t.team} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <span className="text-lg">{t.flag}</span>
                <span className="text-sm font-medium flex-1">{t.team}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                    style={{ width: `${t.prob}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-bold w-10 text-right">{t.prob}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Predictions */}
      <h2 className="font-bold text-sm mb-3">📊 今日 AI 预测</h2>
      <div className="space-y-3 mb-6">
        {Array.isArray(predictions) && predictions.length > 0 ? (
          predictions.map((p: any) => (
            <Link
              key={`${p.homeTeam}-${p.awayTeam}`}
              href={`/matches/${p.homeTeam.toLowerCase().substring(0, 3)}-${p.awayTeam.toLowerCase().substring(0, 3)}`}
              className="card block p-4 hover:shadow-md transition-shadow"
            >
              {/* Teams + Win % */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{p.homeTeam}</span>
                  <span className="text-xs text-gray-400">vs</span>
                  <span className="font-semibold text-sm">{p.awayTeam}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.confidence >= 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  信心 {p.confidence}%
                </span>
              </div>

              {/* Probability bars */}
              <div className="flex items-center gap-1 text-xs mb-2">
                <div className="flex-1 text-center">
                  <div className="bg-blue-100 rounded h-6 flex items-center justify-center font-mono font-bold text-blue-700">
                    {p.homeWinProb}%
                  </div>
                  <span className="text-gray-500 mt-0.5 block">主胜</span>
                </div>
                <div className="w-12 text-center">
                  <div className="bg-gray-100 rounded h-6 flex items-center justify-center font-mono text-gray-500">
                    {p.drawProb}%
                  </div>
                  <span className="text-gray-500 mt-0.5 block">平</span>
                </div>
                <div className="flex-1 text-center">
                  <div className="bg-red-50 rounded h-6 flex items-center justify-center font-mono font-bold text-red-700">
                    {p.awayWinProb}%
                  </div>
                  <span className="text-gray-500 mt-0.5 block">客胜</span>
                </div>
              </div>

              {/* Top score predictions */}
              <div className="flex gap-1 mb-2">
                {p.topScores?.map((s: any, i: number) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-50 rounded font-mono">
                    {s.score} <span className="text-gray-400">{s.prob}%</span>
                  </span>
                ))}
              </div>

              {/* Explanation */}
              <p className="text-xs text-gray-500 leading-relaxed">{p.explanation}</p>

              {/* Upset warning */}
              {p.upsetProb > 20 && p.upsetProb < 45 && (
                <div className="mt-2 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                  ⚠️ 冷门预警：冷门概率 {p.upsetProb}%
                </div>
              )}
            </Link>
          ))
        ) : (
          <div className="card p-8 text-center text-gray-400">
            预测引擎加载中...
          </div>
        )}
      </div>

      {/* Bottom nav to matches */}
      <div className="text-center">
        <Link href="/chat" className="btn-primary text-sm px-4 py-2">
          💬 更多问题？问 AI
        </Link>
      </div>
    </div>
  );
}
