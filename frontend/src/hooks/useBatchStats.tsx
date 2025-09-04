import React from 'react'
import { useProgressAPI } from '../api/progress'

type Row = {
  exercise: string
  level: number
  ema_accuracy: number
  ema_latency_ms: number
  attempts: number
  streak: number
}

export function useBatchStats(exercise: string) {
  const { getProgress } = useProgressAPI()
  const [count, setCount] = React.useState(0)
  const [corrects, setCorrects] = React.useState<number[]>([])
  const [latencies, setLatencies] = React.useState<number[]>([])
  const [before, setBefore] = React.useState<Row | null>(null)
  const [after, setAfter] = React.useState<Row | null>(null)
  const [visible, setVisible] = React.useState(false)

  const startNewBatch = React.useCallback(() => {
    setCount(0); setCorrects([]); setLatencies([]); setBefore(null); setAfter(null); setVisible(false)
  }, [])

  const record = React.useCallback(async (r: { correct: boolean; latency_ms: number }) => {
    // Capture baseline on first item of the batch
    if (count === 0) {
      try {
        const p = await getProgress()
        const row = (p.progress || []).find((x: Row) => x.exercise === exercise) || null
        setBefore(row)
      } catch {}
    }

    setCorrects(prev => [...prev, r.correct ? 1 : 0])
    setLatencies(prev => [...prev, r.latency_ms])
    const nextCount = count + 1
    setCount(nextCount)

    // After 5 answers, fetch "after" and show summary
    if (nextCount >= 5) {
      try {
        const p2 = await getProgress()
        const row2 = (p2.progress || []).find((x: Row) => x.exercise === exercise) || null
        setAfter(row2)
      } catch {}
      setVisible(true)
    }
  }, [count, exercise, getProgress])

  const accuracy = corrects.length ? corrects.reduce((a,b)=>a+b,0) / corrects.length : 0
  const avgLatency = latencies.length ? latencies.reduce((a,b)=>a+b,0) / latencies.length : 0

  const levelUp = before && after ? after.level > before.level : false
  const improvedAcc = before && after ? after.ema_accuracy > before.ema_accuracy : false
  const improvedLat = before && after ? after.ema_latency_ms < before.ema_latency_ms : false

  const summary = {
    visible,
    accuracy,
    avgLatency,
    total: corrects.length,
    correct: corrects.reduce((a,b)=>a+b,0),
    before, after,
    levelUp, improvedAcc, improvedLat,
  }
  const close = () => setVisible(false)

  return { record, summary, close, startNewBatch }
}
