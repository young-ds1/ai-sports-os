"use client";
import { useEffect, useState } from "react";

interface AccuracyData {
  summary: {
    totalMatches: number;
    correctOutcomes: number;
    correctScores: number;
    outcomeAccuracy: number;
    scoreAccuracy: number;
    currentStreak: number;
  };
  matches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    predicted: string;
    actual: string;
    actualScore: string;
    outcomeCorrect: boolean;
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
  }>;
}

const CN_TEAM: Record<string,string> = {"South Korea":"韩国","Czech Republic":"捷克","Canada":"加拿大","Bosnia & Herzegovina":"波黑","USA":"美国","Paraguay":"巴拉圭","Qatar":"卡塔尔","Switzerland":"瑞士","Brazil":"巴西","Morocco":"摩洛哥","Mexico":"墨西哥","South Africa":"南非","Haiti":"海地","Scotland":"苏格兰","Australia":"澳大利亚","Turkey":"土耳其","Germany":"德国","Curaçao":"库拉索","Netherlands":"荷兰","Japan":"日本","Ivory Coast":"科特迪瓦","Ecuador":"厄瓜多尔","Sweden":"瑞典","Tunisia":"突尼斯","Spain":"西班牙","Cape Verde":"佛得角","Belgium":"比利时","Egypt":"埃及","Saudi Arabia":"沙特","Uruguay":"乌拉圭","Iran":"伊朗","New Zealand":"新西兰","France":"法国","Senegal":"塞内加尔","Iraq":"伊拉克","Norway":"挪威","Argentina":"阿根廷","Algeria":"阿尔及利亚","Austria":"奥地利","Jordan":"约旦","Portugal":"葡萄牙","DR Congo":"刚果(金)","England":"英格兰","Croatia":"克罗地亚","Ghana":"加纳","Panama":"巴拿马","Uzbekistan":"乌兹别克斯坦","Colombia":"哥伦比亚"};

const CN: Record<string, string> = {
  home: "主胜", away: "客胜", draw: "平局",
};

export default function AccuracyBadge() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch both data sources and compute accuracy client-side
        const [predsRes, resultsRes] = await Promise.all([
          fetch("/worldcup-predictions.json").then(r => r.json()).catch(() => []),
          fetch("/match-results.json").then(r => r.json()).catch(() => ({ results: [] })),
        ]);
        const predictions = Array.isArray(predsRes) ? predsRes : [];
        const results = resultsRes.results || resultsRes || [];
        const data = computeAccuracy(predictions, Array.isArray(results) ? results : []);
        setData(data);
      } catch (e) {
        console.error("Accuracy load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return null;
  if (!data || data.summary.totalMatches === 0) return null;

  const { summary, matches } = data;
  const recent = matches.slice(-3).reverse();

  return (
    <div className="card p-4 mb-4" style={{
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      border: "1px solid #334155",
      borderRadius: 14,
      color: "#e2e8f0",
    }}>
      {/* Main stat */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">🎯 AI 预测准确率</h3>
        <span className="text-xs text-gray-500">
          已完赛 {summary.totalMatches} 场
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{
            color: summary.outcomeAccuracy >= 60 ? "#10b981" : summary.outcomeAccuracy >= 40 ? "#f59e0b" : "#ef4444",
          }}>
            {summary.outcomeAccuracy}%
          </div>
          <div className="text-xs text-gray-500">胜平负</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs mb-1">
            <span>{summary.correctOutcomes}/{summary.totalMatches} 正确</span>
          </div>
          <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${summary.outcomeAccuracy}%`,
                background: summary.outcomeAccuracy >= 60
                  ? "linear-gradient(90deg, #059669, #10b981)"
                  : summary.outcomeAccuracy >= 40
                  ? "linear-gradient(90deg, #d97706, #f59e0b)"
                  : "linear-gradient(90deg, #dc2626, #ef4444)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Streak */}
      {summary.currentStreak >= 2 && (
        <div className="text-xs mb-3 px-2 py-1 rounded inline-block"
          style={{ background: "#14532d", color: "#4ade80" }}>
          🔥 连续正确 {summary.currentStreak} 场
        </div>
      )}

      {/* Recent results */}
      <div className="space-y-1">
        {recent.map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={m.outcomeCorrect ? "text-green-400" : "text-red-400"}>
              {m.outcomeCorrect ? "✅" : "❌"}
            </span>
            <span className="text-gray-400 w-16">{m.date.slice(5)}</span>
            <span className="text-gray-300 flex-1">
              {CN_TEAM[m.homeTeam] || m.homeTeam} {m.actualScore} {CN_TEAM[m.awayTeam] || m.awayTeam}
            </span>
            <span className="text-gray-500">
              预测{CN[m.predicted] || m.predicted}
            </span>
          </div>
        ))}
      </div>

      {/* Score accuracy */}
      <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
        <span>比分命中: {summary.correctScores}/{summary.totalMatches} ({summary.scoreAccuracy}%)</span>
        <a href="/accuracy" className="text-blue-400 hover:underline">查看全部 →</a>
      </div>
    </div>
  );
}

// Client-side accuracy computation (mirrors compute-accuracy.py logic)
function computeAccuracy(
  predictions: Array<Record<string, any>>,
  results: Array<Record<string, any>>
): AccuracyData {
  const resultMap = new Map<string, any>();
  for (const r of results) {
    resultMap.set(`${r.homeTeam}|${r.awayTeam}`, r);
  }

  const matches: AccuracyData["matches"] = [];
  let correctOutcome = 0;
  let correctScore = 0;

  for (const p of predictions) {
    const result = resultMap.get(`${p.homeTeam}|${p.awayTeam}`);
    if (!result) continue;

    const homeScore = parseInt(result.homeScore) || 0;
    const awayScore = parseInt(result.awayScore) || 0;

    let actual: string;
    if (homeScore > awayScore) actual = "home";
    else if (homeScore === awayScore) actual = "draw";
    else actual = "away";

    const hp = Number(p.homeWinPct || p.homeWinProb || 33);
    const dp = Number(p.drawPct || p.drawProb || 34);
    const ap = Number(p.awayWinPct || p.awayWinProb || 33);

    let predicted: string;
    if (hp >= dp && hp >= ap) predicted = "home";
    else if (dp >= hp && dp >= ap) predicted = "draw";
    else predicted = "away";

    const outcomeCorrect = predicted === actual;
    const bestScore = typeof p.bestScore === "object" ? p.bestScore?.score : p.bestScore;
    const scoreCorrect = bestScore === `${homeScore}-${awayScore}`;

    if (outcomeCorrect) correctOutcome++;
    if (scoreCorrect) correctScore++;

    matches.push({
      date: p.date || "",
      homeTeam: p.homeTeam || "",
      awayTeam: p.awayTeam || "",
      predicted,
      actual,
      actualScore: `${homeScore}-${awayScore}`,
      outcomeCorrect,
      homeWinPct: hp,
      drawPct: dp,
      awayWinPct: ap,
    });
  }

  // Streak from most recent
  let streak = 0;
  for (const m of [...matches].sort((a, b) => b.date.localeCompare(a.date))) {
    if (m.outcomeCorrect) streak++;
    else break;
  }

  const total = matches.length || 1;
  return {
    summary: {
      totalMatches: matches.length,
      correctOutcomes: correctOutcome,
      correctScores: correctScore,
      outcomeAccuracy: Math.round((correctOutcome / total) * 1000) / 10,
      scoreAccuracy: Math.round((correctScore / total) * 1000) / 10,
      currentStreak: streak,
    },
    matches,
  };
}
