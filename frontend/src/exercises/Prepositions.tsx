import React from 'react'
import { Card } from '../components/UI'
import { useProgressAPI } from '../api/progress'
import useItemQueue from '../hooks/useItemQueue'
import type { PrepItem } from '../types/exercises'

function BlankSlot({
  index, filled, onDropWord, isCorrect,
}: { index:number; filled?:string; onDropWord:(i:number,w:string)=>void; isCorrect:boolean|null }) {
  const [hover,setHover]=React.useState(false)
  return (
    <span
      onDragOver={(e)=>{e.preventDefault(); setHover(true)}}
      onDragLeave={()=>setHover(false)}
      onDrop={(e)=>{e.preventDefault(); setHover(false); const w=e.dataTransfer.getData("text/plain"); if(w) onDropWord(index,w)}}
      className={`mx-2 inline-flex min-w-[112px] items-center justify-center rounded-md border-[3px] px-4 py-2 text-base ${
        hover?'bg-orange-100':'bg-white'
      } ${isCorrect===true?'border-green-500':isCorrect===false?'border-rose-400':'border-orange-300'}`}
      role="button" aria-label={`Blank ${index+1}`} tabIndex={0}
    >{filled || <span className="text-stone-400">____</span>}</span>
  )
}

const DraggableWord = ({ word }: { word: string }) => (
  <span
    draggable
    onDragStart={(e)=>e.dataTransfer.setData("text/plain",word)}
    className="inline-flex cursor-grab select-none items-center rounded-full border-[3px] border-orange-300 bg-orange-50 px-5 py-2 text-base text-stone-900 active:cursor-grabbing"
    title="Drag to a blank"
  >
    {word}
  </span>
)

export default function Prepositions(){
  const { reportAttempt, getNext } = useProgressAPI()
  const mapFn = React.useCallback((data:any): PrepItem[] => data.items||[],[])
  const queue = useItemQueue<PrepItem>("prepositions", getNext, mapFn)

  const [fills,setFills]=React.useState<string[]>([])
  const [verdict,setVerdict]=React.useState<(boolean|null)[]|null>(null)
  const startRef = React.useRef(performance.now())
  const item = queue.current

  React.useEffect(()=>{ queue.ensurePrefetch() },[queue])
  React.useEffect(()=>{ if(item){ setFills(Array(item.answer.length).fill("")); setVerdict(null); startRef.current=performance.now() } },[item?.id])

  const dropWord=(blankIndex:number,word:string)=>{ const next=[...fills]; next[blankIndex]=word; setFills(next) }
  const check = ()=>{ if(!item) return; const v = fills.map((w,i)=> !!w && w.toLowerCase()===item.answer[i].toLowerCase()); setVerdict(v); const all=v.every(Boolean)&&v.length===item.answer.length; const latency=Math.max(0,performance.now()-startRef.current); reportAttempt("prepositions",{ item_id:item.id, correct:all, latency_ms:Math.round(latency), difficulty_level:item.answer.length }) }

  // render tokens with an incrementing blank index
  let blankIdx = -1

  return (
    <Card title="Prepositions — Drag the correct word (Adaptive + Batched)" tone="orange">
      <div className="space-y-6">
        <p className="text-lg text-stone-900">
          {item ? item.tokens.map((t:string,i:number)=> t==="{blank}" ? (
            blankIdx++,
            <BlankSlot key={i} index={blankIdx} filled={fills[blankIdx]} onDropWord={dropWord} isCorrect={Array.isArray(verdict)? verdict[blankIdx] : null} />
          ) : <span key={i} className="mx-1 inline-block">{t}</span>) : "Loading…"}
        </p>

        {/* MUCH BIGGER spacing between options */}
        <div className="flex flex-wrap gap-6">
          {["in","on","at","under","over","between","behind"].map(w => <DraggableWord key={w} word={w} />)}
        </div>

        <div className="flex items-center gap-6">
          <button className="rounded-md border-[3px] border-orange-700 bg-orange-700 px-5 py-2 text-white" onClick={check} disabled={!item}>Check</button>
          <button className="rounded-md border-[3px] border-orange-300 bg-orange-50 px-5 py-2 text-stone-900" onClick={queue.refill}>New batch</button>
          <button className="ml-auto rounded-md border-[3px] border-orange-300 bg-orange-50 px-4 py-2 text-stone-900" onClick={queue.next}>Next</button>
        </div>

        {Array.isArray(verdict) && (
          <div className="text-sm text-stone-700">
            {verdict.every(Boolean)? "✅ Correct!" : "Some blanks need another try."}
          </div>
        )}
      </div>
    </Card>
  )
}
