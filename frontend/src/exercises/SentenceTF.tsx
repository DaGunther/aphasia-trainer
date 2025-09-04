import React from 'react'
import { Card } from '../components/UI'
import { useProgressAPI } from '../api/progress'
import useItemQueue from '../hooks/useItemQueue'
import type { TFItem } from '../types/exercises'

export default function SentenceTF(){
  const { reportAttempt, getNext } = useProgressAPI()
  const mapFn = React.useCallback((data:any): TFItem[] => data.items||[],[])
  const queue = useItemQueue<TFItem>("sentence_tf", getNext, mapFn)

  const [choice,setChoice]=React.useState<boolean|null>(null)
  const [feedback,setFeedback]=React.useState<boolean|null>(null)
  const startRef = React.useRef(performance.now())
  const item = queue.current

  React.useEffect(()=>{ queue.ensurePrefetch() },[queue])
  React.useEffect(()=>{ setChoice(null); setFeedback(null); startRef.current=performance.now() },[item?.id])

  const speak = React.useCallback(()=>{ if(!item) return; const u=new SpeechSynthesisUtterance(item.passage); window.speechSynthesis.cancel(); window.speechSynthesis.speak(u) },[item])
  const answer=(val:boolean)=>{ if(!item) return; setChoice(val); const ok = val===item.answer; setFeedback(ok); const latency=Math.max(0,performance.now()-startRef.current); reportAttempt("sentence_tf",{ item_id:item.id, correct:ok, latency_ms:Math.round(latency), difficulty_level: 1+Math.min(4, Math.ceil((item.passage?.length||0)/60)) }) }

  return (
    <Card title="Sentence Comprehension — True or False (Adaptive + Batched)" tone="rose">
      <div className="space-y-6">
        <div className="rounded-md border-[3px] border-rose-300 bg-rose-50 p-4">
          <div className="text-stone-700">Passage</div>
          <p className="mt-1 text-lg text-stone-900">{item? item.passage : "Loading…"}</p>
          <button onClick={speak} className="mt-2 rounded-md border-[3px] border-rose-300 bg-white px-3 py-1 text-sm text-stone-900">🔊 Listen</button>
        </div>
        <div>
          <div className="text-stone-700">Claim</div>
          <p className="mt-1 text-lg text-stone-900">{item? item.claim : ""}</p>
        </div>
        <div className="flex gap-6">
          <button
            onClick={()=>answer(true)}
            className={`rounded-md px-6 py-2 border-[3px] ${choice===true ? 'border-rose-700 bg-rose-700 text-white' : 'border-rose-300 bg-rose-50 text-stone-900'}`}
          >
            True
          </button>
          <button
            onClick={()=>answer(false)}
            className={`rounded-md px-6 py-2 border-[3px] ${choice===false ? 'border-rose-700 bg-rose-700 text-white' : 'border-rose-300 bg-rose-50 text-stone-900'}`}
          >
            False
          </button>
          <button onClick={queue.next} className="ml-auto rounded-md border-[3px] border-rose-300 bg-rose-50 px-4 py-2 text-stone-900">Next</button>
        </div>
        {feedback!=null && (
          <div className={`text-sm ${feedback?'text-green-700':'text-rose-700'}`}>
            {feedback? '✅ Correct' : '❌ Not quite. Try the other option or go Next.'}
          </div>
        )}
      </div>
    </Card>
  )
}
