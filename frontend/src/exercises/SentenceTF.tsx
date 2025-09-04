import React from 'react'
import { Card } from '../components/UI'
import { useProgressAPI } from '../api/progress'
import useItemQueue from '../hooks/useItemQueue'
import type { TFItem } from '../types/exercises'

export default function SentenceTF() {
  const { reportAttempt, getNext } = useProgressAPI()
  const mapFn = React.useCallback((data: any): TFItem[] => data.items || [], [])
  const queue = useItemQueue<TFItem>('sentence_tf', getNext, mapFn)

  const [choice, setChoice] = React.useState<boolean | null>(null)
  const [feedback, setFeedback] = React.useState<boolean | null>(null)
  const startRef = React.useRef(performance.now())
  const item = queue.current

  React.useEffect(() => { queue.ensurePrefetch() }, [queue])
  React.useEffect(() => {
    setChoice(null); setFeedback(null); startRef.current = performance.now()
  }, [item?.id])

  const speak = React.useCallback(() => {
    if (!item) return
    const u = new SpeechSynthesisUtterance(item.passage)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }, [item])

  const answer = (val: boolean) => {
    if (!item) return
    setChoice(val)
    const ok = val === item.answer
    setFeedback(ok)
    const latency = Math.max(0, performance.now() - startRef.current)
    reportAttempt('sentence_tf', {
      item_id: item.id,
      correct: ok,
      latency_ms: Math.round(latency),
      difficulty_level: 1 + Math.min(4, Math.ceil((item.passage?.length || 0) / 60)),
    })
  }

  return (
    <Card title="Sentence Comprehension — True or False (Adaptive + Batched)">
      <div className="space-y-4">
        <div className="rounded-md border bg-neutral-50 p-3">
          <div className="text-neutral-700">Passage</div>
          <p className="mt-1 text-lg">{item ? item.passage : 'Loading…'}</p>
          <button onClick={speak} className="mt-2 rounded-md border px-3 py-1 text-sm">🔊 Listen</button>
        </div>
        <div>
          <div className="text-neutral-700">Claim</div>
          <p className="mt-1 text-lg">{item ? item.claim : ''}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => answer(true)}  className={`rounded-md px-4 py-2 ${choice === true  ? 'bg-black text-white' : 'border'}`}>True</button>
          <button onClick={() => answer(false)} className={`rounded-md px-4 py-2 ${choice === false ? 'bg-black text-white' : 'border'}`}>False</button>
          <button onClick={queue.next} className="ml-auto rounded-md border px-3 py-2">Next</button>
        </div>
        {feedback != null && (
          <div className={`text-sm ${feedback ? 'text-green-600' : 'text-red-600'}`}>
            {feedback ? '✅ Correct' : '❌ Not quite. Try the other option or go Next.'}
          </div>
        )}
      </div>
    </Card>
  )
}
