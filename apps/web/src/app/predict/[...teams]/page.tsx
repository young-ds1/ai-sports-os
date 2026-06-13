"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const FLAG: Record<string,string>={"South Korea":"🇰🇷","Czech Republic":"🇨🇿","Canada":"🇨🇦","Bosnia & Herzegovina":"🇧🇦","USA":"🇺🇸","Paraguay":"🇵🇾","Qatar":"🇶🇦","Switzerland":"🇨🇭","Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴","Australia":"🇦🇺","Turkey":"🇹🇷","Germany":"🇩🇪","Curaçao":"🇨🇼","Netherlands":"🇳🇱","Japan":"🇯🇵","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨","Sweden":"🇸🇪","Tunisia":"🇹🇳","Spain":"🇪🇸","Cape Verde":"🇨🇻","Belgium":"🇧🇪","Egypt":"🇪🇬","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾","Iran":"🇮🇷","New Zealand":"🇳🇿","France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴","Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴","Portugal":"🇵🇹","DR Congo":"🇨🇩","England":"🏴","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","Uzbekistan":"🇺🇿","Colombia":"🇨🇴"};
const CN: Record<string,string>={"South Korea":"韩国","Czech Republic":"捷克","Canada":"加拿大","Bosnia & Herzegovina":"波黑","USA":"美国","Paraguay":"巴拉圭","Qatar":"卡塔尔","Switzerland":"瑞士","Brazil":"巴西","Morocco":"摩洛哥","Haiti":"海地","Scotland":"苏格兰","Australia":"澳大利亚","Turkey":"土耳其","Germany":"德国","Curaçao":"库拉索","Netherlands":"荷兰","Japan":"日本","Ivory Coast":"科特迪瓦","Ecuador":"厄瓜多尔","Sweden":"瑞典","Tunisia":"突尼斯","Spain":"西班牙","Cape Verde":"佛得角","Belgium":"比利时","Egypt":"埃及","Saudi Arabia":"沙特","Uruguay":"乌拉圭","Iran":"伊朗","New Zealand":"新西兰","France":"法国","Senegal":"塞内加尔","Iraq":"伊拉克","Norway":"挪威","Argentina":"阿根廷","Algeria":"阿尔及利亚","Austria":"奥地利","Jordan":"约旦","Portugal":"葡萄牙","DR Congo":"刚果(金)","England":"英格兰","Croatia":"克罗地亚","Ghana":"加纳","Panama":"巴拿马","Uzbekistan":"乌兹别克斯坦","Colombia":"哥伦比亚"};
const cn=(n:string)=>CN[n]||n; const flag=(n:string)=>FLAG[n]||"⚽";
function fact(n:number):number{return n<=1?1:n*fact(n-1)}
function poisson(k:number,l:number):number{if(l<=0)l=0.1;return Math.exp(-l)*Math.pow(l,k)/fact(k)}

export default function PredictPage({ params }: { params: { teams: string[] } }) {
  const ht=decodeURIComponent(params.teams[0]||""), at=decodeURIComponent(params.teams[1]||"");
  const [data,setData]=useState<any>(null); const [match,setMatch]=useState<any>(null);
  const [form,setForm]=useState<any>(null); const [h2h,setH2h]=useState<any>(null);
  const [loading,setLoading]=useState(true); const [err,setErr]=useState("");

  useEffect(()=>{Promise.all([fetch("/worldcup-predictions.json").then(r=>r.json()),fetch("/recent-form.json").then(r=>r.json()).catch(()=>({})),fetch("/h2h.json").then(r=>r.json()).catch(()=>({}))]).then(([all,fd,h2hAll])=>{const m=all.find((x:any)=>x.homeTeam===ht&&x.awayTeam===at);if(!m){setErr("比赛未找到");setLoading(false);return;}setMatch(m);setForm({home:fd[ht],away:fd[at]});const hk=ht+"-"+at;const h2hData=h2hAll[hk]||h2hAll[at+"-"+ht];if(h2hData)setH2h(h2hData);const hG=fd[ht]?Math.max(0.5,fd[ht].goalsScored/Math.max(1,fd[ht].matches?.length||1)):1.5;const aG=fd[at]?Math.max(0.5,fd[at].goalsScored/Math.max(1,fd[at].matches?.length||1)):1.5;const hC=fd[ht]?Math.max(0.3,fd[ht].goalsConceded/Math.max(1,fd[ht].matches?.length||1)):1.2;const aC=fd[at]?Math.max(0.3,fd[at].goalsConceded/Math.max(1,fd[at].matches?.length||1)):1.2;const hp=1/m.oddsHome,dp=1/m.oddsDraw,ap=1/m.oddsAway;const margin=(hp+dp+ap-1)/3;const hClean=hp-margin,aClean=ap-margin;const t=hClean+dp-2*margin+aClean;const impH=Math.max(.05,Math.min(.95,hClean/t)),impA=Math.max(.05,Math.min(.95,aClean/t));const logOddsH=Math.log(impH/(1-impH)),logOddsA=Math.log(impA/(1-impA));const xGh=Math.max(0.5,Math.min(6,1.35*Math.exp(.5*logOddsH)*(.7+.3*Math.min(2,Math.max(.5,hG/1.5)))));const xGa=Math.max(0.5,Math.min(6,1.35*Math.exp(.5*logOddsA)*(.7+.3*Math.min(2,Math.max(.5,aG/1.5)))));const mx:number[][]=[];let hw=0,d=0,aw=0,tp=0;const sc:any[]=[];for(let h=0;h<=5;h++){mx[h]=[];for(let a=0;a<=5;a++){const p=Math.round(poisson(h,xGh)*poisson(a,xGa)*10000)/100;mx[h][a]=p;tp+=p;if(h>a)hw+=p;else if(h===a)d+=p;else aw+=p;sc.push({score:h+"-"+a,prob:p})}}const ou=[0.5,1.5,2.5,3.5,4.5].map(l=>{let o=0,u=0;for(let h=0;h<=5;h++)for(let a=0;a<=5;a++)if(h+a>l)o+=mx[h][a];else u+=mx[h][a];return{line:l,over:Math.round(o/tp*100),under:Math.round(u/tp*100)}});let bY=0,bN=0,cH=0,cA=0;for(let h=0;h<=5;h++)for(let a=0;a<=5;a++){if(h>0&&a>0)bY+=mx[h][a];else bN+=mx[h][a];if(a===0)cH+=mx[h][a];if(h===0)cA+=mx[h][a];}setData({mx,top10:sc.sort((a,b)=>b.prob-a.prob).slice(0,10),win:{h:Math.round(hw/tp*100),d:Math.round(d/tp*100),a:Math.round(aw/tp*100)},mk:{ou,btts:{y:Math.round(bY/tp*100),n:Math.round(bN/tp*100)},cs:{h:Math.round(cH/tp*100),a:Math.round(cA/tp*100)}},xg:{h:Math.round(xGh*100)/100,a:Math.round(xGa*100)/100}});setLoading(false);}).catch(e=>{setErr(e.message);setLoading(false)})},[]);

  const _={bg:"#0a0e14",card:"#12161d",border:"#1c2230",green:"#10b981",red:"#ef4444",yellow:"#f59e0b",gray:"#6b7280",light:"#9ca3af",white:"#e5e7eb",hl:"#1a1f2e"};

  if(loading)return <div style={{minHeight:"100vh",background:_.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:_.gray}}>加载中...</p></div>;
  if(err||!data)return <div style={{minHeight:"100vh",background:_.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><p style={{color:_.gray}}>{err||"无数据"}</p><Link href="/" style={{color:_.green,fontSize:14}}>← 返回</Link></div></div>;

  const {top10,win,mk,xg}=data;
  const fav=win.h>=win.a?ht:at;
  const bestScore=top10[0];

  return <div style={{minHeight:"100vh",background:_.bg,color:_.white,fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}}>
    <header style={{background:_.card,borderBottom:"1px solid "+_.border,padding:"14px 20px",position:"sticky",top:0,zIndex:10}}>
      <div style={{maxWidth:860,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" style={{color:_.gray,fontSize:13,textDecoration:"none"}}>← 全部预测</Link><span style={{fontSize:12,color:_.light}}>{match?.date} · 世界杯小组赛</span></div>
    </header>
    <div style={{maxWidth:860,margin:"0 auto",padding:"24px 16px"}}>

      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:12}}>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:48,marginBottom:4}}>{flag(ht)}</div><div style={{fontSize:20,fontWeight:700}}>{cn(ht)}</div><div style={{fontSize:11,color:_.gray}}>{ht}</div></div>
          <div style={{fontSize:14,fontWeight:700,color:_.gray,background:_.card,padding:"8px 16px",borderRadius:8,border:"1px solid "+_.border}}>VS</div>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:48,marginBottom:4}}>{flag(at)}</div><div style={{fontSize:20,fontWeight:700}}>{cn(at)}</div><div style={{fontSize:11,color:_.gray}}>{at}</div></div>
        </div>
        {form&&(form.home||form.away)&&<div style={{display:"flex",justifyContent:"center",gap:20,fontSize:12,color:_.light}}>{form.home&&<span>📋 {cn(ht)} 近期 {form.home.form} · {form.home.goalsScored}球/{form.home.goalsConceded}失</span>}{form.away&&<span>📋 {cn(at)} 近期 {form.away.form} · {form.away.goalsScored}球/{form.away.goalsConceded}失</span>}</div>}
        {h2h&&<div style={{marginTop:8,fontSize:12,color:_.yellow}}>⚔️ 历史交锋: {h2h.matches}场 · {cn(ht)} {h2h.wins[0]}胜 · {cn(at)} {h2h.wins[1]}胜 · {h2h.last}</div>}
      </div>

      {/* Summary */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:20,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:13,color:_.gray,marginBottom:8}}>AI 预测结论</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}><span style={{color:_.green}}>{cn(fav)} 胜率 {Math.max(win.h,win.a)}%</span></div>
        <div style={{fontSize:28,fontWeight:700,fontFamily:"monospace",color:_.white,marginBottom:4}}>{bestScore.score}</div>
        <div style={{fontSize:13,color:_.gray}}>最可能比分 · 概率 {bestScore.prob}%</div>
      </div>

      {/* Win bar */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:_.white,marginBottom:12}}>胜平负概率</div>
        <div style={{display:"flex",borderRadius:10,overflow:"hidden",height:36,marginBottom:8}}>
          <div style={{width:win.h+"%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{win.h>15?win.h+"%":""}</div>
          <div style={{width:win.d+"%",background:"#374151",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontFamily:"monospace",color:_.light}}>{win.d>10?win.d+"%":""}</div>
          <div style={{width:win.a+"%",background:"linear-gradient(135deg,#dc2626,#b91c1c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{win.a>15?win.a+"%":""}</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:_.gray}}><span>{cn(ht)} {win.h}%</span><span>平 {win.d}%</span><span>{win.a}% {cn(at)}</span></div>
      </div>

      {/* Top 10 */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:_.white,marginBottom:12}}>📊 最可能比分</div>
        {top10.map((s:any,i:number)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontFamily:"monospace",fontWeight:700,fontSize:15,width:40,color:i===0?_.green:_.white}}>{s.score}</span><div style={{flex:1,background:_.hl,borderRadius:4,height:8,overflow:"hidden"}}><div style={{height:8,borderRadius:4,background:i===0?`linear-gradient(90deg,${_.green},${_.green}88)`:_.gray,width:Math.min(s.prob*4,100)+"%"}}/></div><span style={{fontFamily:"monospace",fontSize:12,color:_.gray,width:48,textAlign:"right"}}>{s.prob}%</span></div>))}
      </div>

      {/* Markets */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:_.white,marginBottom:12}}>💰 盘口概率</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:12}}>{mk.ou.map((o:any)=>(<div key={o.line} style={{background:_.hl,borderRadius:10,padding:"10px 6px",textAlign:"center"}}><div style={{fontSize:10,color:_.gray,marginBottom:6}}>大/小 {o.line}</div><div style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:_.green}}>大 {o.over}%</div><div style={{fontSize:10,fontFamily:"monospace",color:_.gray}}>小 {o.under}%</div></div>))}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div style={{background:_.hl,borderRadius:10,padding:12}}><div style={{fontSize:10,color:_.gray,marginBottom:4}}>双方进球 BTTS</div><div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontFamily:"monospace"}}><span style={{color:_.green}}>是 {mk.btts.y}%</span><span style={{color:_.gray}}>否 {mk.btts.n}%</span></div></div><div style={{background:_.hl,borderRadius:10,padding:12}}><div style={{fontSize:10,color:_.gray,marginBottom:4}}>零封 Clean Sheet</div><div style={{fontSize:12,fontFamily:"monospace",display:"flex",justifyContent:"space-between"}}><span>{cn(ht).substring(0,6)} {mk.cs.h}%</span><span>{cn(at).substring(0,6)} {mk.cs.a}%</span></div></div></div>
      </div>

      {/* Prediction Basis */}
      <div style={{background:_.card,border:"1px solid "+_.border,borderRadius:14,padding:16,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:_.white,marginBottom:12}}>🔬 预测依据</div>
        <div style={{fontSize:12,color:_.light,lineHeight:1.8}}>
          <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>真实赔率</span><span>{match.oddsHome}/{match.oddsDraw}/{match.oddsAway} (Pinnacle/Unibet)</span></div>
          <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>Poisson</span><span>赔率→隐含概率→预期进球 xG({xg.h},{xg.a})→比分分布</span></div>
          {form&&(form.home||form.away)&&<div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>近期战绩</span><span>真实热身赛数据已纳入 xG 修正</span></div>}
          {h2h&&<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{background:_.hl,padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",color:_.green}}>交锋记录</span><span>{h2h.matches}场交锋 · {cn(ht)} {h2h.wins[0]}胜 {cn(at)} {h2h.wins[1]}胜</span></div>}
        </div>
      </div>

      <div style={{textAlign:"center",padding:"10px 0 30px"}}><p style={{fontSize:11,color:_.gray,margin:0}}>赔率来源: The Odds API</p></div>
    </div>
  </div>;
}
