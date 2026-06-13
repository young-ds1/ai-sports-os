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
    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}}>
      {/* 简洁 Header */}
      <header style={{background:"#fff",borderBottom:"1px solid #e5e5e5",padding:"0 16px"}}>
        <div style={{maxWidth:960,margin:"0 auto",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Link href="/" style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none",color:"inherit"}}>
            <span style={{fontSize:18}}>⚽</span>
            <span style={{fontWeight:700,fontSize:15,color:"#111"}}>2026世界杯 AI 预测</span>
          </Link>
        </div>
      </header>

      <div style={{maxWidth:960,margin:"0 auto",padding:"16px"}}>
        {/* 准确率 */}
        <AccuracyBadge />

        {/* 夺冠概率 */}
        {tournament?.winnerProbs && (
          <div style={{background:"#fff",borderRadius:12,padding:16,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <h2 style={{fontSize:14,fontWeight:700,color:"#222",marginBottom:12}}>👑 夺冠概率 Top 8</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {tournament.winnerProbs.map((t: any, i: number) => (
                <div key={t.team} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#999",width:16}}>{i + 1}</span>
                  <span style={{fontSize:18}}>{t.flag}</span>
                  <span style={{fontSize:13,fontWeight:500,flex:1,color:"#333"}}>{t.team}</span>
                  <div style={{flex:1,background:"#f0f0f0",borderRadius:6,height:8,overflow:"hidden"}}>
                    <div style={{width:`${t.prob}%`,height:8,borderRadius:6,background:"linear-gradient(90deg,#f59e0b,#f97316)"}} />
                  </div>
                  <span style={{fontSize:12,fontWeight:700,fontFamily:"monospace",color:"#666",width:36,textAlign:"right"}}>{t.prob}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 每日预测 */}
        <h2 style={{fontSize:14,fontWeight:700,color:"#222",marginBottom:12}}>📊 每日 AI 预测</h2>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {Array.isArray(predictions) && predictions.length > 0 ? (
            predictions.map((p: any) => (
              <Link
                key={`${p.homeTeam}-${p.awayTeam}`}
                href={`/matches/${p.homeTeam.toLowerCase().substring(0, 3)}-${p.awayTeam.toLowerCase().substring(0, 3)}`}
                style={{textDecoration:"none",color:"inherit"}}
              >
                <div style={{background:"#fff",borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  {/* 队名 + 信心 */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:14,fontWeight:600,color:"#222"}}>{p.homeTeam}</span>
                      <span style={{fontSize:11,color:"#999"}}>vs</span>
                      <span style={{fontSize:14,fontWeight:600,color:"#222"}}>{p.awayTeam}</span>
                    </div>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:p.confidence>=70?"#dcfce7":"#fef9c3",color:p.confidence>=70?"#16a34a":"#ca8a04"}}>
                      信心 {p.confidence}%
                    </span>
                  </div>
                  {/* 概率条 */}
                  <div style={{display:"flex",gap:4,marginBottom:8}}>
                    <div style={{flex:1,textAlign:"center",background:"#eff6ff",borderRadius:6,padding:"4px 0"}}>
                      <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#2563eb"}}>{p.homeWinProb}%</div>
                      <div style={{fontSize:10,color:"#888"}}>主胜</div>
                    </div>
                    <div style={{width:48,textAlign:"center",background:"#f5f5f5",borderRadius:6,padding:"4px 0"}}>
                      <div style={{fontSize:13,fontFamily:"monospace",color:"#888"}}>{p.drawProb}%</div>
                      <div style={{fontSize:10,color:"#888"}}>平</div>
                    </div>
                    <div style={{flex:1,textAlign:"center",background:"#fef2f2",borderRadius:6,padding:"4px 0"}}>
                      <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#dc2626"}}>{p.awayWinProb}%</div>
                      <div style={{fontSize:10,color:"#888"}}>客胜</div>
                    </div>
                  </div>
                  {/* 比分预测 */}
                  <div style={{display:"flex",gap:4,marginBottom:6}}>
                    {p.topScores?.slice(0,4).map((s: any, i: number) => (
                      <span key={i} style={{fontSize:10,padding:"2px 6px",background:"#f9fafb",borderRadius:4,fontFamily:"monospace",color:"#666"}}>
                        {s.score} <span style={{color:"#aaa"}}>{s.prob}%</span>
                      </span>
                    ))}
                  </div>
                  {/* 解释 */}
                  <p style={{fontSize:11,color:"#888",lineHeight:1.5}}>{p.explanation}</p>
                  {/* 冷门预警 */}
                  {p.upsetProb > 20 && p.upsetProb < 45 && (
                    <div style={{marginTop:6,fontSize:11,background:"#fff7ed",color:"#c2410c",padding:"4px 8px",borderRadius:6}}>
                      ⚠️ 冷门预警：冷门概率 {p.upsetProb}%
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div style={{textAlign:"center",padding:40,color:"#aaa"}}>预测引擎加载中...</div>
          )}
        </div>

        <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"#aaa"}}>
          赔率: The Odds API · Dixon-Coles 校准模型 · 数据仅供参考
        </div>
      </div>
    </div>
  );
}
