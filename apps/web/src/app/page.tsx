import Link from "next/link";
import AccuracyBadge from "@/components/ai/accuracy-badge";

const FLAG: Record<string,string>={"South Korea":"🇰🇷","Czech Republic":"🇨🇿","Canada":"🇨🇦","Bosnia & Herzegovina":"🇧🇦","USA":"🇺🇸","Paraguay":"🇵🇾","Qatar":"🇶🇦","Switzerland":"🇨🇭","Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴","Australia":"🇦🇺","Turkey":"🇹🇷","Germany":"🇩🇪","Curaçao":"🇨🇼","Netherlands":"🇳🇱","Japan":"🇯🇵","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨","Sweden":"🇸🇪","Tunisia":"🇹🇳","Spain":"🇪🇸","Cape Verde":"🇨🇻","Belgium":"🇧🇪","Egypt":"🇪🇬","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾","Iran":"🇮🇷","New Zealand":"🇳🇿","France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴","Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴","Portugal":"🇵🇹","DR Congo":"🇨🇩","England":"🏴","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","Uzbekistan":"🇺🇿","Colombia":"🇨🇴"};
const CN: Record<string,string>={"South Korea":"韩国","Czech Republic":"捷克","Canada":"加拿大","Bosnia & Herzegovina":"波黑","USA":"美国","Paraguay":"巴拉圭","Qatar":"卡塔尔","Switzerland":"瑞士","Brazil":"巴西","Morocco":"摩洛哥","Haiti":"海地","Scotland":"苏格兰","Australia":"澳大利亚","Turkey":"土耳其","Germany":"德国","Curaçao":"库拉索","Netherlands":"荷兰","Japan":"日本","Ivory Coast":"科特迪瓦","Ecuador":"厄瓜多尔","Sweden":"瑞典","Tunisia":"突尼斯","Spain":"西班牙","Cape Verde":"佛得角","Belgium":"比利时","Egypt":"埃及","Saudi Arabia":"沙特","Uruguay":"乌拉圭","Iran":"伊朗","New Zealand":"新西兰","France":"法国","Senegal":"塞内加尔","Iraq":"伊拉克","Norway":"挪威","Argentina":"阿根廷","Algeria":"阿尔及利亚","Austria":"奥地利","Jordan":"约旦","Portugal":"葡萄牙","DR Congo":"刚果(金)","England":"英格兰","Croatia":"克罗地亚","Ghana":"加纳","Panama":"巴拿马","Uzbekistan":"乌兹别克斯坦","Colombia":"哥伦比亚"};

async function getData() {
  try {
    const [p, res] = await Promise.all([
      fetch("http://localhost:3000/worldcup-predictions.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("http://localhost:3000/match-results.json",{cache:"no-store"}).then(r=>r.json()).catch(()=>({results:[]}))
    ]);
    return {predictions:p, results:res.results||[]};
  } catch { return {predictions:[], results:[]}; }
}

export default async function HomePage() {
  const {predictions, results} = await getData();
  const preds = Array.isArray(predictions)?predictions:[];
  const resultMap: Record<string,any> = {};
  for (const r of results) { resultMap[`${r.homeTeam}-${r.awayTeam}`] = r; }
  const dates: Record<string,any[]> = {};
  for (const p of preds) { const d=p.date; if(!dates[d])dates[d]=[]; dates[d].push(p); }

  return (
    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <header style={{background:"#fff",borderBottom:"1px solid #e5e5e5",padding:"0 16px"}}>
        <div style={{maxWidth:960,margin:"0 auto",height:48,display:"flex",alignItems:"center"}}>
          <span style={{fontSize:18}}>⚽</span>
          <span style={{fontWeight:700,fontSize:15,color:"#111",marginLeft:8}}>2026世界杯 AI 预测</span>
        </div>
      </header>
      <div style={{maxWidth:960,margin:"0 auto",padding:"16px"}}>
        {/* Accuracy Badge - 新增 */}
        <AccuracyBadge />

        {Object.entries(dates).slice(0,10).map(([date, matches]) => (
          <div key={date} style={{marginBottom:20}}>
            <h2 style={{fontSize:13,color:"#888",fontWeight:500,margin:"0 0 10px 0",padding:"0 4px"}}>{date} · {matches.length}场</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(matches as any[]).map((p:any) => {
                const key = `${p.homeTeam}-${p.awayTeam}`;
                const done = resultMap[key];
                const href = done ? "#" : `/predict/${encodeURIComponent(p.homeTeam)}/${encodeURIComponent(p.awayTeam)}`;
                return (
                <Link key={key} href={href} style={{textDecoration:"none",color:"inherit",pointerEvents:done?"none":"auto"}}>
                  <div style={{background:"#fff",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",opacity:done?0.5:1}}>
                    <div style={{flex:1,textAlign:"right",display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                      <span style={{fontSize:13,fontWeight:500,color:"#222"}}>{CN[p.homeTeam]||p.homeTeam}</span>
                      <span style={{fontSize:20}}>{FLAG[p.homeTeam]||"⚽"}</span>
                    </div>
                    <div style={{textAlign:"center",minWidth:100}}>
                      {done ? (
                        <div>
                          <div style={{fontSize:22,fontWeight:700,color:"#e00",fontFamily:"monospace",lineHeight:1}}>{done.homeScore} - {done.awayScore}</div>
                          <div style={{fontSize:10,color:"#888",marginTop:2}}>FT</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                            <span style={{fontSize:12,fontFamily:"monospace",color:"#2563eb",fontWeight:600}}>{p.homeWinPct}%</span>
                            <span style={{fontSize:12,fontFamily:"monospace",color:"#888"}}>{p.drawPct}%</span>
                            <span style={{fontSize:12,fontFamily:"monospace",color:"#dc2626",fontWeight:600}}>{p.awayWinPct}%</span>
                          </div>
                          <div style={{fontSize:9,color:"#aaa",marginTop:2}}>{p.kickoff||"TBD"}</div>
                        </div>
                      )}
                    </div>
                    <div style={{flex:1,textAlign:"left",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:20}}>{FLAG[p.awayTeam]||"⚽"}</span>
                      <span style={{fontSize:13,fontWeight:500,color:"#222"}}>{CN[p.awayTeam]||p.awayTeam}</span>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        ))}
        <div style={{textAlign:"center",padding:"20px 0",fontSize:11,color:"#aaa"}}>赔率: The Odds API · Dixon-Coles 校准模型 · 数据仅供参考</div>
      </div>
    </div>
  );
}
