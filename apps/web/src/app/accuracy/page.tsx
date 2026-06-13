"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const CN_TEAM: Record<string, string> = {
  "South Korea": "韩国", "Czech Republic": "捷克", "Canada": "加拿大",
  "Bosnia & Herzegovina": "波黑", "USA": "美国", "Paraguay": "巴拉圭",
  "Qatar": "卡塔尔", "Switzerland": "瑞士", "Brazil": "巴西", "Morocco": "摩洛哥",
  "Haiti": "海地", "Scotland": "苏格兰", "Australia": "澳大利亚", "Turkey": "土耳其",
  "Germany": "德国", "Curaçao": "库拉索", "Netherlands": "荷兰", "Japan": "日本",
  "Ivory Coast": "科特迪瓦", "Ecuador": "厄瓜多尔", "Sweden": "瑞典", "Tunisia": "突尼斯",
  "Spain": "西班牙", "Cape Verde": "佛得角", "Belgium": "比利时", "Egypt": "埃及",
  "Saudi Arabia": "沙特", "Uruguay": "乌拉圭", "Iran": "伊朗", "New Zealand": "新西兰",
  "France": "法国", "Senegal": "塞内加尔", "Iraq": "伊拉克", "Norway": "挪威",
  "Argentina": "阿根廷", "Algeria": "阿尔及利亚", "Austria": "奥地利", "Jordan": "约旦",
  "Portugal": "葡萄牙", "DR Congo": "刚果(金)", "England": "英格兰", "Croatia": "克罗地亚",
  "Ghana": "加纳", "Panama": "巴拿马", "Uzbekistan": "乌兹别克斯坦", "Colombia": "哥伦比亚",
  "Mexico": "墨西哥", "South Africa": "南非",
};

const CN_OUTCOME: Record<string, string> = { home: "主胜", away: "客胜", draw: "平局" };

interface AccuracyData {
  summary: {
    totalMatches: number;
    correctOutcomes: number;
    correctScores: number;
    outcomeAccuracy: number;
    scoreAccuracy: number;
    currentStreak: number;
  };
  byDate: Record<string, { total: number; correct: number; accuracy: number }>;
  matches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    predicted: string;
    actual: string;
    predictedScore: string;
    actualScore: string;
    outcomeCorrect: boolean;
    scoreCorrect: boolean;
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
  }>;
}

function computeAccuracy(predictions: any[], results: any[]): AccuracyData {
  const resultMap = new Map<string, any>();
  for (const r of results) {
    resultMap.set(`${r.homeTeam}|${r.awayTeam}`, r);
  }

  const matches: AccuracyData["matches"] = [];
  let correctOutcome = 0, correctScore = 0;
  const byDate: Record<string, { total: number; correct: number; accuracy: number }> = {};

  for (const p of predictions) {
    const result = resultMap.get(`${p.homeTeam}|${p.awayTeam}`);
    if (!result) continue;

    const hs = parseInt(result.homeScore) || 0;
    const as = parseInt(result.awayScore) || 0;
    let actual: string;
    if (hs > as) actual = "home";
    else if (hs === as) actual = "draw";
    else actual = "away";

    const hp = Number(p.homeWinPct || 33);
    const dp = Number(p.drawPct || 34);
    const ap = Number(p.awayWinPct || 33);
    let predicted: string;
    if (hp >= dp && hp >= ap) predicted = "home";
    else if (dp >= hp && dp >= ap) predicted = "draw";
    else predicted = "away";

    const outcomeCorrect = predicted === actual;
    const bestScore = typeof p.bestScore === "object" ? p.bestScore?.score : p.bestScore || "";
    const scoreCorrect = bestScore === `${hs}-${as}`;

    if (outcomeCorrect) correctOutcome++;
    if (scoreCorrect) correctScore++;

    const date = p.date || "";
    if (!byDate[date]) byDate[date] = { total: 0, correct: 0, accuracy: 0 };
    byDate[date].total++;
    if (outcomeCorrect) byDate[date].correct++;

    matches.push({
      date, homeTeam: p.homeTeam, awayTeam: p.awayTeam,
      predicted, actual, predictedScore: bestScore, actualScore: `${hs}-${as}`,
      outcomeCorrect, scoreCorrect,
      homeWinPct: hp, drawPct: dp, awayWinPct: ap,
    });
  }

  for (const d of Object.values(byDate)) {
    d.accuracy = Math.round((d.correct / Math.max(d.total, 1)) * 1000) / 10;
  }

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
    byDate,
    matches: matches.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export default function AccuracyPage() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/worldcup-predictions.json").then(r => r.json()).catch(() => []),
      fetch("/match-results.json").then(r => r.json()).catch(() => ({ results: [] })),
    ]).then(([preds, res]) => {
      const results = res.results || res || [];
      setData(computeAccuracy(Array.isArray(preds) ? preds : [], Array.isArray(results) ? results : []));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;
  }

  if (!data || data.summary.totalMatches === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 gap-4">
        <p className="text-lg">暂无完赛数据</p>
        <p className="text-sm">比赛结束后，AI 预测准确率将在这里展示</p>
        <Link href="/" className="text-blue-400 text-sm hover:underline">← 返回首页</Link>
      </div>
    );
  }

  const { summary, matches } = data;

  return (
    <div className="min-h-screen" style={{ background: "#0a0e14", color: "#e5e7eb", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">← 返回</Link>
          <h1 className="text-lg font-bold">🎯 AI 预测准确率</h1>
          <div className="w-10" />
        </div>

        {/* Big stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-4 rounded-xl" style={{ background: "#12161d", border: "1px solid #1c2230" }}>
            <div className="text-3xl font-bold" style={{ color: summary.outcomeAccuracy >= 60 ? "#10b981" : summary.outcomeAccuracy >= 40 ? "#f59e0b" : "#ef4444" }}>
              {summary.outcomeAccuracy}%
            </div>
            <div className="text-xs text-gray-500 mt-1">胜平负准确率</div>
            <div className="text-xs text-gray-600">{summary.correctOutcomes}/{summary.totalMatches}</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: "#12161d", border: "1px solid #1c2230" }}>
            <div className="text-3xl font-bold text-blue-400">{summary.scoreAccuracy}%</div>
            <div className="text-xs text-gray-500 mt-1">比分准确率</div>
            <div className="text-xs text-gray-600">{summary.correctScores}/{summary.totalMatches}</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: "#12161d", border: "1px solid #1c2230" }}>
            <div className="text-3xl font-bold text-orange-400">{summary.currentStreak}</div>
            <div className="text-xs text-gray-500 mt-1">连续正确</div>
            <div className="text-xs text-gray-600">场</div>
          </div>
        </div>

        {/* Per-match accuracy */}
        <h2 className="text-sm font-bold text-gray-400 mb-3">📋 逐场对比</h2>
        <div className="space-y-2">
          {matches.map((m, i) => (
            <div
              key={i}
              className="p-4 rounded-xl flex items-center gap-3"
              style={{
                background: m.outcomeCorrect ? "#0a2e1a" : "#2e0a0a",
                border: `1px solid ${m.outcomeCorrect ? "#14532d" : "#7f1d1d"}`,
              }}
            >
              <span className="text-lg">{m.outcomeCorrect ? "✅" : "❌"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{CN_TEAM[m.homeTeam] || m.homeTeam}</span>
                  <span className="text-lg font-mono font-bold">{m.actualScore}</span>
                  <span className="font-medium">{CN_TEAM[m.awayTeam] || m.awayTeam}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{m.date}</span>
                  <span>·</span>
                  <span>预测 {CN_OUTCOME[m.predicted] || m.predicted}</span>
                  <span>·</span>
                  <span className="text-gray-600">
                    概率: 主{m.homeWinPct}% / 平{m.drawPct}% / 客{m.awayWinPct}%
                  </span>
                </div>
                {m.predictedScore && (
                  <div className="text-xs mt-1">
                    <span className="text-gray-600">AI预测比分: </span>
                    <span className={m.scoreCorrect ? "text-green-400" : "text-gray-500"}>{m.predictedScore}</span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-xs px-2 py-0.5 rounded ${m.outcomeCorrect ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                  {m.outcomeCorrect ? "正确" : "错误"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-600">
          数据来源: The Odds API + ESPN · 模型: Dixon-Coles 校准 Poisson
        </div>
      </div>
    </div>
  );
}
