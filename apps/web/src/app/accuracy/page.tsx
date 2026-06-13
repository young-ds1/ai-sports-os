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
const STYLE = {
  bg: "#0a0e14", card: "#12161d", border: "#1c2230",
  green: "#10b981", red: "#ef4444", yellow: "#f59e0b",
  gray: "#6b7280", light: "#9ca3af", white: "#e5e7eb", hl: "#1a1f2e", blue: "#3b82f6",
};

interface AccuracyData {
  summary: { totalMatches: number; correctOutcomes: number; correctScores: number;
    outcomeAccuracy: number; scoreAccuracy: number; currentStreak: number; };
  byDate: Record<string, { total: number; correct: number; accuracy: number }>;
  matches: Array<{ date: string; homeTeam: string; awayTeam: string; predicted: string;
    actual: string; predictedScore: string; actualScore: string; outcomeCorrect: boolean;
    scoreCorrect: boolean; homeWinPct: number; drawPct: number; awayWinPct: number; }>;
}

function computeAccuracy(predictions: any[], results: any[]): AccuracyData {
  const resultMap = new Map<string, any>();
  for (const r of results) resultMap.set(`${r.homeTeam}|${r.awayTeam}`, r);

  const matches: AccuracyData["matches"] = [];
  let correctOutcome = 0, correctScore = 0;
  const byDate: Record<string, { total: number; correct: number; accuracy: number }> = {};

  for (const p of predictions) {
    const result = resultMap.get(`${p.homeTeam}|${p.awayTeam}`);
    if (!result) continue;
    const hs = parseInt(result.homeScore) || 0, as = parseInt(result.awayScore) || 0;
    let actual: string;
    if (hs > as) actual = "home"; else if (hs === as) actual = "draw"; else actual = "away";
    const hp = Number(p.homeWinPct || 33), dp = Number(p.drawPct || 34), ap = Number(p.awayWinPct || 33);
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
    byDate[date].total++; if (outcomeCorrect) byDate[date].correct++;

    matches.push({ date, homeTeam: p.homeTeam, awayTeam: p.awayTeam, predicted, actual,
      predictedScore: bestScore, actualScore: `${hs}-${as}`, outcomeCorrect, scoreCorrect,
      homeWinPct: hp, drawPct: dp, awayWinPct: ap });
  }

  for (const d of Object.values(byDate)) d.accuracy = Math.round((d.correct / Math.max(d.total, 1)) * 1000) / 10;

  let streak = 0;
  for (const m of [...matches].sort((a, b) => b.date.localeCompare(a.date))) {
    if (m.outcomeCorrect) streak++; else break;
  }

  const total = matches.length || 1;
  return {
    summary: { totalMatches: matches.length, correctOutcomes: correctOutcome,
      correctScores: correctScore,
      outcomeAccuracy: Math.round((correctOutcome / total) * 1000) / 10,
      scoreAccuracy: Math.round((correctScore / total) * 1000) / 10,
      currentStreak: streak },
    byDate, matches: matches.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

// Confidence calibration: group predictions by confidence level
function confidenceCalibration(matches: AccuracyData["matches"]) {
  const buckets = [
    { label: "高信心 (≥60%)", min: 60, max: 100, correct: 0, total: 0 },
    { label: "中信心 (50-59%)", min: 50, max: 59, correct: 0, total: 0 },
    { label: "胶着 (40-49%)", min: 40, max: 49, correct: 0, total: 0 },
    { label: "低信心 (<40%)", min: 0, max: 39, correct: 0, total: 0 },
  ];
  for (const m of matches) {
    const maxPct = Math.max(m.homeWinPct, m.drawPct, m.awayWinPct);
    for (const b of buckets) {
      if (maxPct >= b.min && maxPct <= b.max) { b.total++; if (m.outcomeCorrect) b.correct++; break; }
    }
  }
  return buckets.filter(b => b.total > 0);
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

  if (loading) return <div style={{minHeight:"100vh",background:STYLE.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:STYLE.gray}}>加载中...</p></div>;
  if (!data || data.summary.totalMatches === 0) return (
    <div style={{minHeight:"100vh",background:STYLE.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:STYLE.gray,gap:16}}>
      <p style={{fontSize:18}}>暂无完赛数据</p>
      <p style={{fontSize:14}}>比赛结束后，AI 预测准确率将在这里展示</p>
      <Link href="/" style={{color:STYLE.blue,fontSize:14,textDecoration:"none"}}>← 返回首页</Link>
    </div>
  );

  const { summary, matches } = data;
  const calibration = confidenceCalibration(matches);
  const outcomeColor = (v: number) => v >= 60 ? STYLE.green : v >= 40 ? STYLE.yellow : STYLE.red;

  return (
    <div style={{minHeight:"100vh",background:STYLE.bg,color:STYLE.white,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <div style={{maxWidth:860,margin:"0 auto",padding:"24px 16px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <Link href="/" style={{color:STYLE.gray,fontSize:13,textDecoration:"none"}}>← 返回</Link>
          <h1 style={{fontSize:18,fontWeight:700,margin:0}}>🎯 AI 预测准确率追踪</h1>
          <div style={{width:40}}/>
        </div>

        {/* Big Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
          {[
            {label:"胜平负", value:summary.outcomeAccuracy+"%", sub:`${summary.correctOutcomes}/${summary.totalMatches}`, color:outcomeColor(summary.outcomeAccuracy)},
            {label:"比分命中", value:summary.scoreAccuracy+"%", sub:`${summary.correctScores}/${summary.totalMatches}`, color:STYLE.blue},
            {label:"连续正确", value:String(summary.currentStreak), sub:"场", color:STYLE.yellow},
            {label:"已完赛", value:String(summary.totalMatches), sub:"场", color:STYLE.gray},
          ].map((s,i) => (
            <div key={i} style={{background:STYLE.card,border:"1px solid "+STYLE.border,borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:700,color:s.color,marginBottom:4}}>{s.value}</div>
              <div style={{fontSize:11,color:STYLE.gray,marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:10,color:STYLE.light}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* NEW: Confidence Calibration */}
        {calibration.length > 0 && (
          <div style={{background:STYLE.card,border:"1px solid "+STYLE.border,borderRadius:14,padding:16,marginBottom:20}}>
            <h2 style={{fontSize:14,fontWeight:600,color:STYLE.white,margin:"0 0 12px 0"}}>📐 信心校准</h2>
            <div style={{fontSize:12,color:STYLE.gray,marginBottom:12}}>
              模型预测的信心度越高，是否真的越准？
            </div>
            {calibration.map((b, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<calibration.length-1?8:0}}>
                <span style={{fontSize:12,color:STYLE.light,width:100}}>{b.label}</span>
                <div style={{flex:1,background:STYLE.hl,borderRadius:4,height:8,overflow:"hidden"}}>
                  <div style={{height:8,borderRadius:4,background:`linear-gradient(90deg,${STYLE.green},${STYLE.green}88)`,
                    width:`${b.total>0?b.correct/b.total*100:0}%`}}/>
                </div>
                <span style={{fontSize:12,fontFamily:"monospace",color:outcomeColor(b.total>0?b.correct/b.total*100:0),width:80,textAlign:"right"}}>
                  {b.correct}/{b.total} ({b.total>0?Math.round(b.correct/b.total*100):0}%)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* NEW: Accuracy Trend (by date) */}
        {Object.keys(data.byDate).length > 1 && (
          <div style={{background:STYLE.card,border:"1px solid "+STYLE.border,borderRadius:14,padding:16,marginBottom:20}}>
            <h2 style={{fontSize:14,fontWeight:600,color:STYLE.white,margin:"0 0 12px 0"}}>📈 每日准确率走势</h2>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
              {Object.entries(data.byDate).map(([date, d]) => (
                <div key={date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:10,fontFamily:"monospace",color:outcomeColor(d.accuracy)}}>{d.accuracy}%</span>
                  <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${outcomeColor(d.accuracy)},${outcomeColor(d.accuracy)}44)`,
                    height:`${Math.max(8,d.accuracy*0.7)}px`}}/>
                  <span style={{fontSize:9,color:STYLE.gray}}>{date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-match list */}
        <h2 style={{fontSize:14,fontWeight:600,color:STYLE.white,margin:"0 0 12px 0"}}>📋 逐场对比</h2>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {matches.map((m, i) => (
            <div key={i} style={{
              background: m.outcomeCorrect ? "#0a2e1a" : "#2e0a0a",
              border: `1px solid ${m.outcomeCorrect ? "#14532d" : "#7f1d1d"}`,
              borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
            }}>
              <span style={{fontSize:20}}>{m.outcomeCorrect ? "✅" : "❌"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:14}}>
                  <span style={{fontWeight:500}}>{CN_TEAM[m.homeTeam] || m.homeTeam}</span>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:18}}>{m.actualScore}</span>
                  <span style={{fontWeight:500}}>{CN_TEAM[m.awayTeam] || m.awayTeam}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,fontSize:11,color:STYLE.gray}}>
                  <span>{m.date}</span>
                  <span>·</span>
                  <span>预测 {CN_OUTCOME[m.predicted] || m.predicted}</span>
                  <span>·</span>
                  <span style={{color:STYLE.light}}>概率: 主{m.homeWinPct}% / 平{m.drawPct}% / 客{m.awayWinPct}%</span>
                </div>
                {m.predictedScore && (
                  <div style={{fontSize:11,marginTop:2}}>
                    <span style={{color:STYLE.gray}}>AI预测比分: </span>
                    <span style={{color:m.scoreCorrect ? STYLE.green : STYLE.gray,fontFamily:"monospace"}}>{m.predictedScore}</span>
                    {m.scoreCorrect && <span style={{color:STYLE.green,marginLeft:6}}>🎯 命中!</span>}
                  </div>
                )}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:600,color:m.outcomeCorrect ? STYLE.green : STYLE.red}}>
                  {m.outcomeCorrect ? "正确" : "错误"}
                </div>
                <div style={{fontSize:10,color:STYLE.gray}}>
                  {Math.max(m.homeWinPct, m.drawPct, m.awayWinPct)}%信心
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NEW: Summary insight */}
        {matches.length >= 3 && (
          <div style={{background:STYLE.card,border:"1px solid "+STYLE.border,borderRadius:14,padding:16,marginTop:20,textAlign:"center"}}>
            <h2 style={{fontSize:14,fontWeight:600,color:STYLE.white,margin:"0 0 8px 0"}}>🧠 AI 洞察</h2>
            <div style={{fontSize:12,color:STYLE.light,lineHeight:1.8}}>
              {summary.outcomeAccuracy >= 60
                ? `✅ 胜平负准确率 ${summary.outcomeAccuracy}%，超过菠菜市场平均水平。模型在 ${summary.totalMatches} 场比赛中正确预测了 ${summary.correctOutcomes} 场的结果。`
                : `📊 胜平负准确率 ${summary.outcomeAccuracy}%，已完赛 ${summary.totalMatches} 场。随着比赛推进，Elo动态更新将逐步提升精度。`
              }
              {summary.scoreAccuracy > 0
                ? ` 比分命中率 ${summary.scoreAccuracy}%（行业天花板约15%）。`
                : ` 比分命中需更多完赛数据。`}
              {summary.currentStreak >= 2
                ? ` 🔥 连续 ${summary.currentStreak} 场正确！`
                : ""}
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:24,fontSize:11,color:STYLE.gray}}>
          数据来源: The Odds API + ESPN · Bivariate Poisson + 12因子 · 192场历史校准
        </div>
      </div>
    </div>
  );
}
