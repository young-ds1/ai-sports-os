"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const FLAG: Record<string,string>={"South Korea":"🇰🇷","Czech Republic":"🇨🇿","Canada":"🇨🇦","Bosnia & Herzegovina":"🇧🇦","USA":"🇺🇸","Paraguay":"🇵🇾","Qatar":"🇶🇦","Switzerland":"🇨🇭","Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴","Australia":"🇦🇺","Turkey":"🇹🇷","Germany":"🇩🇪","Curaçao":"🇨🇼","Netherlands":"🇳🇱","Japan":"🇯🇵","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨","Sweden":"🇸🇪","Tunisia":"🇹🇳","Spain":"🇪🇸","Cape Verde":"🇨🇻","Belgium":"🇧🇪","Egypt":"🇪🇬","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾","Iran":"🇮🇷","New Zealand":"🇳🇿","France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴","Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴","Portugal":"🇵🇹","DR Congo":"🇨🇩","England":"🏴","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","Uzbekistan":"🇺🇿","Colombia":"🇨🇴"};
const CN: Record<string,string>={"South Korea":"韩国","Czech Republic":"捷克","Canada":"加拿大","Bosnia & Herzegovina":"波黑","USA":"美国","Paraguay":"巴拉圭","Qatar":"卡塔尔","Switzerland":"瑞士","Brazil":"巴西","Morocco":"摩洛哥","Haiti":"海地","Scotland":"苏格兰","Australia":"澳大利亚","Turkey":"土耳其","Germany":"德国","Curaçao":"库拉索","Netherlands":"荷兰","Japan":"日本","Ivory Coast":"科特迪瓦","Ecuador":"厄瓜多尔","Sweden":"瑞典","Tunisia":"突尼斯","Spain":"西班牙","Cape Verde":"佛得角","Belgium":"比利时","Egypt":"埃及","Saudi Arabia":"沙特","Uruguay":"乌拉圭","Iran":"伊朗","New Zealand":"新西兰","France":"法国","Senegal":"塞内加尔","Iraq":"伊拉克","Norway":"挪威","Argentina":"阿根廷","Algeria":"阿尔及利亚","Austria":"奥地利","Jordan":"约旦","Portugal":"葡萄牙","DR Congo":"刚果(金)","England":"英格兰","Croatia":"克罗地亚","Ghana":"加纳","Panama":"巴拿马","Uzbekistan":"乌兹别克斯坦","Colombia":"哥伦比亚"};
const cn=(n:string)=>CN[n]||n; const flag=(n:string)=>FLAG[n]||"⚽";

const PRESSURE_LABEL: Record<string,string> = {
  mustWin: "必须赢", needResult: "需要积分", normal: "正常", deadRubber: "无欲无求", finalGroupMatch: "末轮生死战",
};
const STYLE_LABEL: Record<string,string> = {
  possession: "传控", counter: "防反", balanced: "均衡", physical: "身体对抗",
};

export default function PredictPage({ params }: { params: { teams: string[] } }) {
  const ht=decodeURIComponent(params.teams[0]||""), at=decodeURIComponent(params.teams[1]||"");
  const [match,setMatch]=useState<any>(null);
  const [form,setForm]=useState<any>(null);
  const [h2h,setH2h]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [showFactors, setShowFactors] = useState(false);

  useEffect(()=>{
    Promise.all([
      fetch("/worldcup-predictions.json").then(r=>r.json()),
      fetch("/recent-form.json").then(r=>r.json()).catch(()=>({})),
      fetch("/h2h.json").then(r=>r.json()).catch(()=>({})),
    ]).then(([all,fd,h2hAll])=>{
      const m=all.find((x:any)=>x.homeTeam===ht&&x.awayTeam===at);
      if(!m){setErr("比赛未找到");setLoading(false);return;}
      setMatch(m);
      setForm({home:fd[ht],away:fd[at]});
      const hk=ht+"-"+at;
      const h2hData=h2hAll[hk]||h2hAll[at+"-"+ht];
      if(h2hData)setH2h(h2hData);
      setLoading(false);
    }).catch(e=>{setErr(e.message);setLoading(false)});
  },[]);

  const _={bg:"#0a0e14",card:"#12161d",border:"#1c2230",green:"#10b981",red:"#ef4444",yellow:"#f59e0b",gray:"#6b7280",light:"#9ca3af",white:"#e5e7eb",hl:"#1a1f2e",blue:"#3b82f6",orange:"#f97316"};

  if(loading)return <div style={{minHeight:"100vh",background:_.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:_.gray}}>加载中...</p></div>;
  if(err||!match)return <div style={{minHeight:"100vh",background:_.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><p style={{color:_.gray}}>{err||"无数据"}</p><Link href="/" style={{color:_.green,fontSize:14}}>← 返回</Link></div></div>;

  const topScores = match.topScores || [];
  const bestScore = match.bestScore || topScores[0];
  const hwp = match.homeWinPct || 33;
  const dwp = match.drawPct || 34;
  const awp = match.awayWinPct || 33;
  const fav = hwp >= awp ? ht : at;
  const hasEvents = (match.eventHome || 0) !== 0 || (match.eventAway || 0) !== 0;
  const hasHistory = match.historicalSimilar && match.historicalSimilar.matchCount > 0;
  const hasPressure = match.pressureHome && match.pressureHome !== 'normal' || match.pressureAway && match.pressureAway !== 'normal';
  const hasTactic = match.tacticMult && match.tacticMult !== 1.0;
  const hasFatigue = (match.fatigueHome && match.fatigueHome < 0.97) || (match.fatigueAway && match.fatigueAway < 0.97);
  const hasWeather = (match.weatherTotalAdj || 0) !== 0;

  const section = (title: string) => (
    <div style={{fontSize:12,fontWeight:600,color:_.white,marginBottom:12}}>{title}</div>
  );

  return <div style={{minHeight:"100vh",background:_.bg,color:_.white,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}}>
    {/* Header */}
    <header style={{background:_.card,borderBottom:"1px solid "+_.border,padding:"14px 20px",position:"sticky",top:0,zIndex:10}}>
      <div style={{maxWidth:860,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Link href="/" style={{color:_.gray,fontSize:13,textDecoration:"none"}}>← 全部预测</Link>
        <span style={{fontSize:12,color:_.light}}>{match.date} · 世界杯小组赛</span>
      </div>
    </header>

    <div style={{maxWidth:860,margin:"0 auto",padding:"24px 16px"}}>
      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:12}}>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:48,marginBottom:4}}>{flag(ht)}</div><div style={{fontSize:20,fontWeight:700}}>{cn(ht)}</div><div style={{fontSize:11,color:_.gray}}>{ht}</div></div>
          <div style={{fontSize:14,fontWeight:700,color:_.gray,background:_.card,padding:"8px 16px",borderRadius:8,border:"1px solid "+_.border}}>VS</div>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:48,marginBottom:4}}>{flag(at)}</div><div style={{fontSize:20,fontWeight:700}}>{cn(at)}</div><div style={{fontSize:11,color:_.gray}}>{at}</div></div>
        </div>
        {form&&(form.home||form.away)&&<div style={{display:"flex",justifyContent:"center",gap:20,fontSize:12,color:_.light}}>
          {form.home&&<span>📋 {cn(ht)} 近期 {form.home.form} · {form.home.goalsScored}球/{form.home.goalsConceded}失</span>}
          {form.away&&<span>📋 {cn(at)} 近期 {form.away.form} · {form.away.goalsScored}球/{form.away.goalsConceded}失</span>}
        </div>}
        {h2h&&<div style={{marginTop:8,fontSize:12,color:_.yellow}}>⚔️ 历史交锋: {h2h.matches}场 · {cn(ht)} {h2h.wins[0]}胜 · {cn(at)} {h2h.wins[1]}胜 · {h2h.last}</div>}
      </div>

      {/* Summary */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:20,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:13,color:_.gray,marginBottom:8}}>AI 预测结论</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}><span style={{color:_.green}}>{cn(fav)} 胜率 {Math.max(hwp,awp)}%</span></div>
        <div style={{fontSize:28,fontWeight:700,fontFamily:"monospace",color:_.white,marginBottom:4}}>{bestScore?.score||"?"}</div>
        <div style={{fontSize:13,color:_.gray}}>最可能比分 · 概率 {bestScore?.prob||0}%</div>
        {match.xgHome && <div style={{fontSize:11,color:_.gray,marginTop:4}}>预期进球 xG: {match.xgHome}/{match.xgAway} · Elo: {match.eloHome}/{match.eloAway}</div>}
      </div>

      {/* Win bar */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        {section("胜平负概率")}
        <div style={{display:"flex",borderRadius:10,overflow:"hidden",height:36,marginBottom:8}}>
          <div style={{width:hwp+"%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{hwp>15?hwp+"%":""}</div>
          <div style={{width:dwp+"%",background:"#374151",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontFamily:"monospace",color:_.light}}>{dwp>10?dwp+"%":""}</div>
          <div style={{width:awp+"%",background:"linear-gradient(135deg,#dc2626,#b91c1c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{awp>15?awp+"%":""}</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:_.gray}}><span>{cn(ht)} {hwp}%</span><span>平 {dwp}%</span><span>{awp}% {cn(at)}</span></div>
      </div>

      {/* Top 10 Scores */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        {section("📊 最可能比分")}
        {topScores.map((s:any,i:number)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontFamily:"monospace",fontWeight:700,fontSize:15,width:40,color:i===0?_.green:_.white}}>{s.score}</span>
            <div style={{flex:1,background:_.hl,borderRadius:4,height:8,overflow:"hidden"}}>
              <div style={{height:8,borderRadius:4,background:i===0?`linear-gradient(90deg,${_.green},${_.green}88)`:_.gray,width:Math.min(s.prob*4,100)+"%"}}/>
            </div>
            <span style={{fontFamily:"monospace",fontSize:12,color:_.gray,width:48,textAlign:"right"}}>{s.prob}%</span>
          </div>
        ))}
      </div>

      {/* ⚠️ Event Alerts — NEW */}
      {hasEvents && (
        <div style={{background:"#1a0a0a",border:"1px solid #7f1d1d",borderRadius:14,padding:16,marginBottom:16}}>
          {section("⚠️ 场外因素")}
          <div style={{fontSize:12,lineHeight:1.8}}>
            {match.eventHome !== 0 && (
              <div style={{marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>{flag(ht)}</span>
                <span style={{color:_.light}}>{cn(ht)}</span>
                <span style={{color:match.eventHome<0?_.red:_.green,fontWeight:600,fontFamily:"monospace"}}>
                  {match.eventHome>0?"+":""}{match.eventHome} Elo点
                </span>
              </div>
            )}
            {match.eventAway !== 0 && (
              <div style={{marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>{flag(at)}</span>
                <span style={{color:_.light}}>{cn(at)}</span>
                <span style={{color:match.eventAway<0?_.red:_.green,fontWeight:600,fontFamily:"monospace"}}>
                  {match.eventAway>0?"+":""}{match.eventAway} Elo点
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📜 Historical Comparison — NEW */}
      {hasHistory && (
        <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
          {section("📜 历史相似对阵")}
          <div style={{fontSize:11,color:_.gray,marginBottom:8}}>
            从192场世界杯历史数据中匹配 Elo差≈{Math.round(match.historicalSimilar.avgEloDiff)} 的 {match.historicalSimilar.matchCount} 场相似比赛
          </div>
          {/* Outcome comparison */}
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {(["home","draw","away"] as const).map((o,i)=>{
              const pct = match.historicalSimilar.outcomes[o]||0;
              const colors = ["#2563eb","#6b7280","#dc2626"];
              const labels = [`${cn(ht)}胜`, "平局", `${cn(at)}胜`];
              return <div key={o} style={{flex:1,textAlign:"center",background:_.hl,borderRadius:8,padding:"8px 4px"}}>
                <div style={{fontSize:16,fontWeight:700,fontFamily:"monospace",color:colors[i]}}>{pct}%</div>
                <div style={{fontSize:10,color:_.gray}}>{labels[i]}</div>
              </div>;
            })
          }</div>
          {/* Historical top scores */}
          <div style={{fontSize:11,color:_.light}}>
            历史最常见比分: {(match.historicalSimilar.topScores||[]).slice(0,5).map(([s,c]:[string,number])=>(
              <span key={s} style={{marginRight:8,fontFamily:"monospace"}}>{s}({c}场)</span>
            ))}
          </div>
          {/* Model vs History alignment */}
          {(()=>{
            const histTop = (match.historicalSimilar.topScores||[])[0];
            if (!histTop) return null;
            const histBest = histTop[0];
            const modelBest = bestScore?.score;
            const agree = histBest === modelBest;
            return (
              <div style={{marginTop:8,fontSize:11,padding:"4px 8px",borderRadius:6,background:agree?_.green+"20":_.red+"20",color:agree?_.green:_.red}}>
                {agree ? "✅ 模型预测与历史数据一致" : `⚠️ 模型预测 ${modelBest}，历史最常见 ${histBest}`}
              </div>
            );
          })()}
        </div>
      )}

      {/* 🔬 Factor Breakdown — NEW (collapsible) */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
             onClick={()=>setShowFactors(!showFactors)}>
          {section("🔬 预测因子分析")}
          <span style={{fontSize:11,color:_.gray}}>{showFactors?"收起":"展开"} ▼</span>
        </div>
        {showFactors && (
          <div style={{fontSize:12,lineHeight:2.2}}>
            {/* Elo */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>Elo实力</span>
              <span style={{fontFamily:"monospace",color:_.white}}>{cn(ht)} {match.eloHome||"?"} vs {cn(at)} {match.eloAway||"?"}</span>
            </div>
            {/* Experience */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>阵容经验</span>
              <span style={{fontFamily:"monospace"}}>
                <span style={{color:(match.experienceHome||0)>=0?_.green:_.red}}>{cn(ht)} {(match.experienceHome||0)>0?"+"+match.experienceHome:match.experienceHome||0}</span>
                {" / "}
                <span style={{color:(match.experienceAway||0)>=0?_.green:_.red}}>{cn(at)} {(match.experienceAway||0)>0?"+"+match.experienceAway:match.experienceAway||0}</span>
                 Elo点
              </span>
            </div>
            {/* Fatigue */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>疲劳度</span>
              <span style={{fontFamily:"monospace",color:_.light}}>
                休息: {cn(ht)} {match.restHome??"首场"}天 / {cn(at)} {match.restAway??"首场"}天
                {" · "}
                <span style={{color:(match.fatigueHome||1)<1?_.yellow:_.light}}>{cn(ht)} {(match.fatigueHome||1)*100}%</span>
                {" / "}
                <span style={{color:(match.fatigueAway||1)<1?_.yellow:_.light}}>{cn(at)} {(match.fatigueAway||1)*100}%</span>
              </span>
            </div>
            {/* Pressure */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>出线压力</span>
              <span style={{fontFamily:"monospace"}}>
                <span style={{color:(match.pressureHome||"normal")!=="normal"?_.orange:_.light}}>{cn(ht)} {PRESSURE_LABEL[match.pressureHome]||"正常"}</span>
                {" / "}
                <span style={{color:(match.pressureAway||"normal")!=="normal"?_.orange:_.light}}>{cn(at)} {PRESSURE_LABEL[match.pressureAway]||"正常"}</span>
              </span>
            </div>
            {/* Tactical */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>战术匹配</span>
              <span style={{fontFamily:"monospace",color:_.light}}>
                {cn(ht)} {STYLE_LABEL[match.styleHome]||"均衡"} vs {cn(at)} {STYLE_LABEL[match.styleAway]||"均衡"}
                {hasTactic && <span style={{color:match.tacticMult>1?_.green:_.red,marginLeft:4}}>
                  ({cn(ht)} {(match.tacticMult-1)*100>0?"+":""}{Math.round((match.tacticMult-1)*100)}%)
                </span>}
              </span>
            </div>
            {/* Weather */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>天气</span>
              <span style={{fontFamily:"monospace",color:_.light}}>
                {hasWeather ? `总进球调整 ${match.weatherTotalAdj>0?"+":""}${match.weatherTotalAdj} ${match.weatherPhysical?"· 身体对抗队占优":""}` : "正常/无数据"}
              </span>
            </div>
            {/* Odds signal */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:80,color:_.gray}}>赔率信号</span>
              <span style={{fontFamily:"monospace",color:(match.oddsSignal||0)!==0?(match.oddsSignal>0?_.green:_.red):_.light}}>
                {(match.oddsSignal||0)!==0 ? `${match.oddsSignal>0?"看涨":"看跌"} ${match.oddsSignal} Elo点` : "无变动"}
              </span>
            </div>
            {/* xG */}
            <div style={{display:"flex",alignItems:"center",gap:8,borderTop:"1px solid "+_.border,marginTop:8,paddingTop:8}}>
              <span style={{width:80,color:_.gray}}>预期进球</span>
              <span style={{fontFamily:"monospace",color:_.white,fontWeight:600}}>
                xG {match.xgHome||"?"} - {match.xgAway||"?"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Markets — keep existing */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        {section("💰 盘口概率")}
        {/* Generate from odds */}
        {(()=>{
          const oh=match.oddsHome||2, od=match.oddsDraw||3.5, oa=match.oddsAway||3.5;
          const hp2=1/oh, dp2=1/od, ap2=1/oa;
          const mg=(hp2+dp2+ap2-1)/3;
          const hc2=Math.max(.02,hp2-mg), ac2=Math.max(.02,ap2-mg);
          const t2=hc2+Math.max(.02,dp2-mg)+ac2;
          const impH2=hc2/t2, impA2=ac2/t2;
          const xgh2=Math.max(.3,Math.min(6,1.35*Math.exp(.5*Math.log(impH2/(1-impH2))))),
                xga2=Math.max(.3,Math.min(6,1.35*Math.exp(.5*Math.log(impA2/(1-impA2)))));
          const ouLines=[0.5,1.5,2.5,3.5,4.5].map(l=>{
            let o=0,u=0,t=0;
            for(let h=0;h<=5;h++)for(let a=0;a<=5;a++){
              const pa=Math.exp(-xgh2)*Math.pow(xgh2,h)/[...Array(h+1)].reduce((p,_,i)=>p*Math.max(1,i),1)*
                       Math.exp(-xga2)*Math.pow(xga2,a)/[...Array(a+1)].reduce((p,_,i)=>p*Math.max(1,i),1)*100;
              t+=pa;if(h+a>l)o+=pa;else u+=pa;
            }
            return {line:l,over:Math.round(o/t*100),under:Math.round(u/t*100)};
          });
          return <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
            {ouLines.map((o:any)=><div key={o.line} style={{background:_.hl,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:10,color:_.gray,marginBottom:6}}>大/小 {o.line}</div>
              <div style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:_.green}}>大 {o.over}%</div>
              <div style={{fontSize:10,fontFamily:"monospace",color:_.gray}}>小 {o.under}%</div>
            </div>)}
          </div>;
        })()}
      </div>

      {/* Prediction Basis */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        {section("🔬 预测来源")}
        <div style={{fontSize:12,color:_.light,lineHeight:1.8}}>
          <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>市场赔率</span><span>{match.oddsHome}/{match.oddsDraw}/{match.oddsAway} (Pinnacle/Unibet)</span></div>
          <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>Elo模型</span><span>Bivariate Poisson + Dixon-Coles ρ + 12因子校准 (192场历史)</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>融合策略</span><span>市场赔率70% + Elo模型30% → 胜平负；100% Elo模型 → 比分分布</span></div>
        </div>
      </div>

      <div style={{textAlign:"center",padding:"10px 0 30px"}}>
        <p style={{fontSize:11,color:_.gray,margin:0}}>{match.source||"赔率: The Odds API · 数据仅供参考"}</p>
      </div>
    </div>
  </div>;
}
