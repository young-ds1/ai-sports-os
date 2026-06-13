import Link from "next/link";
import AccuracyBadge from "@/components/ai/accuracy-badge";
import fs from "fs";
import path from "path";

const CN: Record<string,string> = {
  Argentina:"阿根廷",France:"法国",Brazil:"巴西",England:"英格兰",
  Spain:"西班牙",Germany:"德国",Portugal:"葡萄牙",Netherlands:"荷兰",
  Belgium:"比利时",Uruguay:"乌拉圭",Croatia:"克罗地亚",Colombia:"哥伦比亚",
  Morocco:"摩洛哥",Senegal:"塞内加尔",Japan:"日本",Iran:"伊朗",
  USA:"美国",Mexico:"墨西哥",Austria:"奥地利",Sweden:"瑞典",
  Turkey:"土耳其",Ecuador:"厄瓜多尔",Egypt:"埃及","South Korea":"韩国",
  Australia:"澳大利亚",Canada:"加拿大","Ivory Coast":"科特迪瓦",
  "Saudi Arabia":"沙特",Qatar:"卡塔尔",Tunisia:"突尼斯",Scotland:"苏格兰",
  Norway:"挪威",Algeria:"阿尔及利亚",Ghana:"加纳",Iraq:"伊拉克",
  Panama:"巴拿马","South Africa":"南非","Czech Republic":"捷克",
  "Cape Verde":"佛得角",Curaçao:"库拉索",Haiti:"海地","New Zealand":"新西兰",
  Jordan:"约旦",Uzbekistan:"乌兹别克斯坦","DR Congo":"刚果(金)",
  "Bosnia & Herzegovina":"波黑",Paraguay:"巴拉圭",Switzerland:"瑞士",
};
const cn = (n:string) => CN[n] || n;

const FLAGS: Record<string,string> = {
  Argentina:"🇦🇷",France:"🇫🇷",Brazil:"🇧🇷",England:"🏴",
  Spain:"🇪🇸",Germany:"🇩🇪",Portugal:"🇵🇹",Netherlands:"🇳🇱",
  Belgium:"🇧🇪",Uruguay:"🇺🇾",Croatia:"🇭🇷",Colombia:"🇨🇴",
  Morocco:"🇲🇦",Senegal:"🇸🇳",Japan:"🇯🇵",Iran:"🇮🇷",
  USA:"🇺🇸",Mexico:"🇲🇽",Austria:"🇦🇹",Sweden:"🇸🇪",
  Turkey:"🇹🇷",Ecuador:"🇪🇨",Egypt:"🇪🇬","South Korea":"🇰🇷",
  Australia:"🇦🇺",Canada:"🇨🇦","Ivory Coast":"🇨🇮",
  "Saudi Arabia":"🇸🇦",Qatar:"🇶🇦",Tunisia:"🇹🇳",Scotland:"🏴",
  Norway:"🇳🇴",Algeria:"🇩🇿",Ghana:"🇬🇭",Iraq:"🇮🇶",
  Panama:"🇵🇦","South Africa":"🇿🇦","Czech Republic":"🇨🇿",
  "Cape Verde":"🇨🇻",Curaçao:"🇨🇼",Haiti:"🇭🇹","New Zealand":"🇳🇿",
  Jordan:"🇯🇴",Uzbekistan:"🇺🇿","DR Congo":"🇨🇩","Bosnia & Herzegovina":"🇧🇦",
  Paraguay:"🇵🇾",Switzerland:"🇨🇭",
};

const PRESSURE_ICON: Record<string,string> = {
  mustWin:"🔴", needResult:"🟡", finalGroupMatch:"🔥",
};

function getPredictions() {
  try {
    const fp = path.join(process.cwd(), "public", "worldcup-predictions.json");
    const raw = fs.readFileSync(fp, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function getEvents() {
  try {
    // events.json is at project root, two levels up from apps/web
    const fp = path.join(process.cwd(), "..", "..", "events.json");
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

function getMatchResults() {
  try {
    const fp = path.join(process.cwd(), "public", "match-results.json");
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

export default function HomePage() {
  const predictions = getPredictions();
  const eventsData = getEvents();
  const resultsData = getMatchResults();

  // Active events lookup
  const activeEvents: Record<string, any[]> = {};
  if (eventsData?.events) {
    const today = new Date().toISOString().slice(0,10);
    for (const e of eventsData.events) {
      if (e.expiresAfter < today) continue;
      const t = e.team;
      if (!activeEvents[t]) activeEvents[t] = [];
      activeEvents[t].push(e);
    }
  }

  // Completed matches lookup
  const completedMatches = new Set<string>();
  if (resultsData?.results) {
    for (const r of resultsData.results) {
      completedMatches.add(`${r.homeTeam}|${r.awayTeam}`);
    }
  }

  // Tournament ranking
  const teamScores: Record<string, number> = {};
  for (const p of predictions) {
    teamScores[p.homeTeam] = (teamScores[p.homeTeam] || 0) + (p.homeWinPct || 0);
    teamScores[p.awayTeam] = (teamScores[p.awayTeam] || 0) + (p.awayWinPct || 0);
  }
  const tournament = Object.entries(teamScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([team, score]) => ({
      team, prob: Math.round(score / Math.max(predictions.length, 1)),
      flag: FLAGS[team] || "⚽",
    }));

  // Group predictions by date
  const byDate: Record<string, any[]> = {};
  for (const p of predictions) {
    const d = p.date || "未知";
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(p);
  }

  // Count matches with factors
  const hasEvents = Object.keys(activeEvents).length > 0;
  const today = new Date().toISOString().slice(0,10);
  const todayPreds = predictions.filter((p:any) => p.date === today);

  // Build match factor indicators
  function getFactors(p: any): string[] {
    const f: string[] = [];
    if (p.eventHome !== 0 || p.eventAway !== 0) f.push("📰");
    if (p.pressureHome && p.pressureHome !== "normal") f.push("🔴");
    if (p.pressureAway && p.pressureAway !== "normal") f.push("🔴");
    if (p.tacticMult && p.tacticMult !== 1.0) f.push("⚔️");
    if (p.fatigueHome && p.fatigueHome < 0.97 || p.fatigueAway && p.fatigueAway < 0.97) f.push("😴");
    if (p.oddsSignal && p.oddsSignal !== 0) f.push("📊");
    return f;
  }

  return (
    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}}>
      {/* Header */}
      <header style={{background:"#fff",borderBottom:"1px solid #e5e5e5",padding:"0 16px"}}>
        <div style={{maxWidth:960,margin:"0 auto",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center"}}>
            <span style={{fontSize:18}}>⚽</span>
            <span style={{fontWeight:700,fontSize:15,color:"#111",marginLeft:8}}>2026世界杯 AI 预测</span>
          </div>
          <Link href="/accuracy" style={{fontSize:11,color:"#6b7280",textDecoration:"none",padding:"2px 10px",borderRadius:4,border:"1px solid #e5e5e5"}}>
            准确率 →
          </Link>
        </div>
      </header>

      <div style={{maxWidth:960,margin:"0 auto",padding:"16px"}}>
        <AccuracyBadge />

        {/* ⚠️ Event Alert Banner — NEW */}
        {hasEvents && (
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:"#dc2626",marginBottom:6}}>📰 场外事件预警</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(activeEvents).map(([team, evts]) =>
                evts.map((e:any,i:number) => (
                  <span key={`${team}-${i}`} style={{fontSize:11,background:"#fff",padding:"3px 8px",borderRadius:6,border:"1px solid #fecaca",color:"#991b1b"}}>
                    {FLAGS[team]||"⚽"} {cn(team)}: {e.event} ({e.severity>0?"+":""}{e.severity} Elo)
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* Today's Focus — NEW */}
        {todayPreds.length > 0 && (
          <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#dc2626",marginBottom:10}}>📅 今日关注 ({today})</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {todayPreds.map((p:any) => {
                const factors = getFactors(p);
                const isCompleted = completedMatches.has(`${p.homeTeam}|${p.awayTeam}`);
                return (
                  <Link key={`${p.homeTeam}-${p.awayTeam}`} href={`/predict/${encodeURIComponent(p.homeTeam)}/${encodeURIComponent(p.awayTeam)}`}
                    style={{textDecoration:"none",color:"inherit",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:isCompleted?"#f0fdf4":"#fafafa"}}>
                    <span style={{fontSize:16}}>{FLAGS[p.homeTeam]||"⚽"}</span>
                    <span style={{fontSize:13,fontWeight:500,flex:1}}>{cn(p.homeTeam)} vs {cn(p.awayTeam)}</span>
                    {factors.map((f,i)=><span key={i} style={{fontSize:13}}>{f}</span>)}
                    <span style={{fontSize:11,color:"#999"}}>{p.kickoff||""}</span>
                    <span style={{fontSize:12,fontWeight:700,fontFamily:"monospace",color:"#2563eb"}}>
                      {p.homeWinPct}%/{p.drawPct}%/{p.awayWinPct}%
                    </span>
                    {isCompleted && <span style={{fontSize:10,color:"#10b981"}}>✓ 已完赛</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 夺冠概率 */}
        <div style={{background:"#fff",borderRadius:12,padding:16,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <h2 style={{fontSize:14,fontWeight:700,color:"#222",margin:"0 0 12px 0"}}>👑 夺冠概率 Top 8</h2>
          {tournament.map((t, i) => (
            <div key={t.team} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<7?8:0}}>
              <span style={{fontSize:11,color:"#999",width:16}}>{i + 1}</span>
              <span style={{fontSize:18}}>{t.flag}</span>
              <span style={{fontSize:13,fontWeight:500,flex:1,color:"#333"}}>{cn(t.team)}</span>
              <div style={{flex:1,background:"#f0f0f0",borderRadius:6,height:8,overflow:"hidden"}}>
                <div style={{width:`${t.prob}%`,height:8,borderRadius:6,background:"linear-gradient(90deg,#f59e0b,#f97316)"}} />
              </div>
              <span style={{fontSize:12,fontWeight:700,fontFamily:"monospace",color:"#666",width:36,textAlign:"right"}}>{t.prob}%</span>
            </div>
          ))}
        </div>

        {/* 每日预测 */}
        <h2 style={{fontSize:14,fontWeight:700,color:"#222",margin:"0 0 12px 0"}}>📊 每日 AI 预测</h2>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {Object.entries(byDate).map(([date, preds]) => (
            <div key={date}>
              <div style={{fontSize:11,color:"#999",marginBottom:6,fontWeight:600}}>{date}</div>
              {preds.map((p: any) => {
                const href = `/predict/${encodeURIComponent(p.homeTeam)}/${encodeURIComponent(p.awayTeam)}`;
                const factors = getFactors(p);
                const isCompleted = completedMatches.has(`${p.homeTeam}|${p.awayTeam}`);
                return (
                  <Link key={`${p.homeTeam}-${p.awayTeam}`} href={href} style={{textDecoration:"none",color:"inherit"}}>
                    <div style={{background:isCompleted?"#f0fdf4":"#fff",borderRadius:10,padding:"12px 16px",marginBottom:6,
                      boxShadow:"0 1px 3px rgba(0,0,0,0.04)",border:isCompleted?"1px solid #bbf7d0":"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:18}}>{FLAGS[p.homeTeam] || "⚽"}</span>
                          <span style={{fontSize:14,fontWeight:600,color:"#222"}}>{cn(p.homeTeam)}</span>
                          <span style={{fontSize:11,color:"#999"}}>vs</span>
                          <span style={{fontSize:14,fontWeight:600,color:"#222"}}>{cn(p.awayTeam)}</span>
                          <span style={{fontSize:18}}>{FLAGS[p.awayTeam] || "⚽"}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          {factors.map((f,i)=><span key={i} style={{fontSize:12}} title="有影响因素">{f}</span>)}
                          {isCompleted && <span style={{fontSize:10,color:"#10b981",background:"#dcfce7",padding:"1px 6px",borderRadius:4}}>完赛</span>}
                          {activeEvents[p.homeTeam] && <span style={{fontSize:10,color:"#dc2626",background:"#fef2f2",padding:"1px 6px",borderRadius:4}}>📰事件</span>}
                          {activeEvents[p.awayTeam] && <span style={{fontSize:10,color:"#dc2626",background:"#fef2f2",padding:"1px 6px",borderRadius:4}}>📰事件</span>}
                          <span style={{fontSize:11,color:"#999"}}>{p.kickoff||""}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:4,marginBottom:6}}>
                        <div style={{flex:1,textAlign:"center",background:"#eff6ff",borderRadius:6,padding:"4px 0"}}>
                          <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#2563eb"}}>{p.homeWinPct}%</div>
                          <div style={{fontSize:10,color:"#888"}}>主胜</div>
                        </div>
                        <div style={{width:48,textAlign:"center",background:"#f5f5f5",borderRadius:6,padding:"4px 0"}}>
                          <div style={{fontSize:13,fontFamily:"monospace",color:"#888"}}>{p.drawPct}%</div>
                          <div style={{fontSize:10,color:"#888"}}>平</div>
                        </div>
                        <div style={{flex:1,textAlign:"center",background:"#fef2f2",borderRadius:6,padding:"4px 0"}}>
                          <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#dc2626"}}>{p.awayWinPct}%</div>
                          <div style={{fontSize:10,color:"#888"}}>客胜</div>
                        </div>
                      </div>
                      {p.topScores && (
                        <div style={{display:"flex",gap:4,marginBottom:4}}>
                          {p.topScores.slice(0,4).map((s: any, i: number) => (
                            <span key={i} style={{fontSize:10,padding:"2px 6px",background:"#f9fafb",borderRadius:4,fontFamily:"monospace",color:"#666"}}>
                              {s.score} <span style={{color:"#aaa"}}>{s.prob}%</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"#aaa"}}>
          赔率: The Odds API · Bivariate Poisson + 12因子校准 · 192场历史数据 · 内容仅供参考
        </div>
      </div>
    </div>
  );
}
