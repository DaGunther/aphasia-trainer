import React from 'react'
import { Card, Pill } from '../components/UI'
import { scoreAgainstTarget } from '../lib/scoring'
import useSpeechRecognition from '../hooks/useSpeechRecognition'
import useItemQueue from '../hooks/useItemQueue'
import { useProgressAPI } from '../api/progress'
import type { SpeechItem } from '../types/exercises'

export default function SpeechMatch() {
  const { reportAttempt, getNext } = useProgressAPI()
  const [strictness, setStrictness] =
    React.useState<'lenient'|'normal'|'strict'>('lenient')
  const { supported, listening, start, stop } = useSpeechRecognition()
  const [last, setLast] = React.useState<null | {
    heard: string; coverage: number; wer: number; accepted: boolean
  }>(null)
  const [typed, setTyped] = React.useState('')
  const startedRef = React.useRef(performance.now())

  const mapFn = React.useCallback((data: any): SpeechItem[] => {
    return (data.phrases || []).map((p: any) => ({
      id: p.id || p.target,
      target: p.target || p,
    }))
  }, [])
  const queue = useItemQueue<SpeechItem>('speech', getNext, mapFn)

  React.useEffect(() => { queue.ensurePrefetch() }, [queue])
  React.useEffect(() => {
    startedRef.current = performance.now()
    setLast(null); setTyped('')
  }, [queue.current?.id])

  const handleStart = () => {
    const t0 = performance.now()
    start((alts: Array<{ transcript: string; confidence: number }>) => {
      let best: typeof last = null
      for (const a of alts) {
        const s = scoreAgainstTarget(a.transcript, queue.current?.target || '', strictness)
        const score = { ...s, heard: a.transcript }
        if (!best) best = score
        else {
          const better =
            (score.accepted && !best.accepted) ||
            (score.accepted === best.accepted &&
              (score.coverage > best.coverage ||
               (score.coverage === best.coverage && score.wer < best.wer)))
          if (better) best = score
        }
      }
      setLast(best)
      const latency = Math.max(0, performance.now() - t0)
      reportAttempt('speech', {
        item_id: queue.current?.id,
        correct: !!best?.accepted,
        latency_ms: Math.round(latency),
        difficulty_level: { lenient: 1, normal: 3, strict: 5 }[strictness],
      })
    })
  }

  const handleTypeCheck = () => {
    const s = scoreAgainstTarget(typed, queue.current?.target || '', strictness)
    const latency = Math.max(0, performance.now() - startedRef.current)
    setLast({ ...s, heard: typed })
    reportAttempt('speech', {
      item_id: queue.current?.id,
      correct: !!s?.accepted,
      latency_ms: Math.round(latency),
      difficulty_level: { lenient: 1, normal: 3, strict: 5 }[strictness],
    })
  }

  return (
    <Card title="Speech Matching (Adaptive + Batched)">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Level adapts on backend</Pill>
          <label className="ml-auto text-sm font-medium">Strictness:</label>
          <select
            className="rounded-md border px-3 py-2"
            value={strictness}
            onChange={e => setStrictness(e.target.value as any)}
          >
            <option value="lenient">Lenient</option>
            <option value="normal">Normal</option>
            <option value="strict">Strict</option>
          </select>
        </div>

        <div className="rounded-md border bg-neutral-50 p-3">
          <div className="text-neutral-700">Say this:</div>
          <p className="mt-1 text-lg">{queue.current?.target ?? 'Loading…'}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={!supported || listening || !queue.current}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            {listening ? 'Listening…' : supported ? 'Speak now' : 'Speech not supported'}
          </button>
          <button onClick={stop} disabled={!listening} className="rounded-md border px-4 py-2">Stop</button>
          <div className="text-sm text-neutral-600">or type:</div>
          <input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            className="min-w-[12rem] rounded-md border px-3 py-2"
            placeholder="Type what was said"
          />
          <button onClick={handleTypeCheck} className="rounded-md border px-3 py-2">Check</button>
          <button onClick={queue.next} className="ml-auto rounded-md border px-3 py-2">Next</button>
        </div>

        {last && (
          <div className="mt-3 space-y-2 rounded-lg border p-3">
            <div><span className="font-medium">Target:</span> {queue.current?.target}</div>
            <div><span className="font-medium">Heard:</span> {last.heard}</div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>Coverage {Math.round(last.coverage * 100)}%</Pill>
              <Pill>WER {last.wer.toFixed(2)}</Pill>
              <Pill>{last.accepted ? '✅ Close enough' : '❌ Try again'}</Pill>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
