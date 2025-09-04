import React from 'react'
import { Card } from './UI'

type Tone = 'amber'|'orange'|'rose'|'stone'

export default function BatchSummary({
  tone = 'stone',
  data,
  onContinue,
}: {
  tone?: Tone
  data: any
  onContinue: () => void
}) {
  const accPct = Math.round((data.accuracy || 0) * 100)
  const avgSec = (data.avgLatency || 0) / 1000

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card tone={tone} title="Batch Summary">
        <div className="space-y-3">
          <div className="text-base text-stone-900">
            Correct: <b>{data.correct}</b> / {data.total} ({accPct}%)
          </div>
          <div className="text-base text-stone-900">
            Avg response time: <b>{avgSec.toFixed(2)}s</b>
          </div>

          {data.before && data.after && (
            <div className="text-sm text-stone-800">
              <div>Level: <b>{data.before.level}</b> → <b>{data.after.level}</b></div>
              <div>EMA accuracy: <b>{Math.round(data.before.ema_accuracy*100)}%</b> → <b>{Math.round(data.after.ema_accuracy*100)}%</b></div>
              <div>EMA latency: <b>{Math.round(data.before.ema_latency_ms)}ms</b> → <b>{Math.round(data.after.ema_latency_ms)}ms</b></div>
            </div>
          )}

          <Outcome data={data} />

          <div className="pt-2">
            <button
              onClick={onContinue}
              className="rounded-md border-[3px] border-stone-800 bg-stone-800 px-5 py-2 text-white"
            >
              Continue
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Outcome({ data }: { data: any }) {
  let msg = 'Keep practicing—new batch ready.'
  if (data.levelUp) msg = `🎉 Level up! You’re now level ${data.after?.level}.`
  else if (data.improvedAcc || data.improvedLat) msg = 'Nice improvement this batch!'
  return <div className="text-stone-900">{msg}</div>
}
