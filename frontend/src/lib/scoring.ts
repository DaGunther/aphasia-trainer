const STOPWORDS = new Set(["the","a","an","to","of","and","is","are","was","were","in","on","at","for","with","that","this","it","i","you","he","she","they","we","please"])

export const norm = (s:string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu," ").replace(/\s+/g," ").trim()
export const tokens = (s:string) => norm(s).split(" ").filter(Boolean)
export const contentWords = (ws:string[]) => ws.filter(w=>!STOPWORDS.has(w))

function lev(a:string,b:string){
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0))
  for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j
  for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){
    const cost=a[i-1]===b[j-1]?0:1
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost)
  }} return dp[m][n]
}
function near(a:string,b:string){ if(a===b) return true; const d=lev(a,b); return d<=Math.max(1,Math.floor(Math.min(a.length,b.length)/3)) }

export function scoreAgainstTarget(
  transcript:string, target:string, strictness:'lenient'|'normal'|'strict'='normal'
){
  const tTok = contentWords(tokens(target)), hTok=contentWords(tokens(transcript))
  const hits = tTok.filter(t=>hTok.some(h=>near(h,t)))
  const coverage = tTok.length? hits.length/tTok.length : 1
  const m=tTok.length,n=hTok.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0))
  for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j
  for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){ const c=near(tTok[i-1],hTok[j-1])?0:1; dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+c) }}
  const wer = m? dp[m][n]/m : 0
  const thresholds = { lenient:{min:0.65,max:0.6}, normal:{min:0.75,max:0.5}, strict:{min:0.9,max:0.25} }[strictness]
  const accepted = coverage>=thresholds.min && wer<=thresholds.max
  return {accepted, coverage, wer}
}
