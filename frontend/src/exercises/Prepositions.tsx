import React from 'react'
import { Card } from '../components/UI'
import { useProgressAPI } from '../api/progress'
import useItemQueue from '../hooks/useItemQueue'
import type { PrepItem } from '../types/exercises'

function BlankSlot({
  index, filled, onDropWord, isCorrect,
}: { index: number; filled?: string; onDropWord: (i:number,w:string)=>void; isCorrect: boolean | null }) {
  const [hover, setHover] = React.useState(false)
  return (
    <span
      onDragOver={(e) => { e.preventDefault(); setHover(true) }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); const w = e.dataTransfer.getData('text/plain'); if (w) onDropWord(index, w) }}
      className={`mx-1 inline-flex min-w-[64px] items-center justify-center rounded-md border px-2 py-1 text-sm ${hover ? 'bg-neutral-100' : 'bg-white'} ${isCorrect === true ? 'border-green-500' : isCorrect === false ? 'border-red-400' : ''}`}
      role="button" aria-label={`Blank ${index + 1}`} tabIndex={0}
    >{filled || <span className="text-neutral-400">____</span>}</span>
  )
}

const DraggableWord = ({ word }: { word: string }) => (
  <span
    draggable
    onDragStart={(e) => e.dataTransfer.setData('text/plain', word)}
    className="inline-flex cursor-grab select-none items-center rounded-full border bg-neutral-50 px-3 py-1 text-sm active:cursor-grabbing"
  >{word}</span>
)

export default function Prepositions() {
  const { reportAttempt, getNext } = useProgressAPI()
  const mapFn = React.useCallback((data: any): PrepItem[] => data.items || [], [])
  const queue = useItemQueue<PrepItem>('prepositions', getNext, mapFn)

  const [fills, setFills] = React.useState<string[]>([])
  const [verdict, setVerdict] = React.useState<(boolean | null)[] | null>(null)
  const startRef = React.useRef(performance.now())
  const item = queue.current

  React.useEffect(() => { queue.ensurePrefetch() }, [queue])
  React.useEffect(() => {
    if (item) {
      setFills(Array(item.answer.length).fill(''))
      setVerdict(null)
      startRef.current = performance.now()
    }
  }, [item?.id])

  const dropWord = (blankIndex: number, word: string) => {
    const next = [...fills]; next[blankIndex] = word; setFills(next)
  }

  const check = () => {
    if (!item) return
    const v = fills.map((w, i) => !!w && w.toLowerCase() === item.answer[i].toLowerCase())
    setVerdict(v)
    const all = v.every(Boolean) && v.length === item.answer.length
    const latency = Math.max(0, performance.now() - startRef.current)
    reportAttempt('prepositions', {
      item_id: item.id,
      correct: all,
      latency_ms: Math.round(latency),
      difficulty_level: item.answer.length,
    })
  }

  // render tokens with incremental blank index
  let blankIdx = -1

  return (
    <Card title="Prepositions — Drag the correct word (Adaptive + Batched)">
      <div className="space-y-4">
        <p className="text-lg">
          {item
            ? item.tokens.map((t, i) =>
                t === '{blank}'
                  ? (blankIdx++,
                    <BlankSlot
                      key={i}
                      index={blankIdx}
                      filled={fills[blankIdx]}
                      onDropWord={dropWord}
                      isCorrect={Array.isArray(verdict) ? verdict[blankIdx] : null}
                    />)
                  : <span key={i} className="mx-1 inline-block">{t}</span>)
            : 'Loading…'}
        </p>

        <div className="flex flex-wrap gap-2">
          {['in', 'on', 'at', 'under', 'over', 'between', 'behind'].map(w => <DraggableWord key={w} word={w} />)}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={check} disabled={!item} className="rounded-md bg-black px-4 py-2 text-white">Check</button>
          <button onClick={queue.refill} className="rounded-md border px-4 py-2">New batch</button>
          <button onClick={queue.next} className="ml-auto rounded-md border px-3 py-2">Next</button>
        </div>

        {Array.isArray(verdict) && (
          <div className="text-sm text-neutral-600">
            {verdict.every(Boolean) ? '✅ Correct!' : 'Some blanks need another try.'}
          </div>
        )}
      </div>
    </Card>
  )
}
