import React from 'react'
import { Card } from './UI'
import { useProgressAPI } from '../api/progress'

export default function ProgressPanel() {
  const { getProgress } = useProgressAPI()
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async ()=>{
    setLoading(true)
    try { setData(await getProgress()) }
    finally { setLoading(false) }
  }, [getProgress])

  React.useEffect(()=>{ refresh() }, [refresh])

  return (
    <Card title="Your Progress" tone="stone">
      <div className="flex items-center gap-3">
        <button
          onClick={refresh}
          className="rounded-md border-2 border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800 hover:bg-stone-100"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {data && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-600">
                <th className="py-2">Exercise</th>
                <th>Level</th>
                <th>EMA Accuracy</th>
                <th>EMA Latency (ms)</th>
                <th>Attempts</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {(data.progress || []).map((p:any)=>(
                <tr key={p.exercise} className="border-t border-stone-200">
                  <td className="py-2">{p.exercise}</td>
                  <td>{p.level}</td>
                  <td>{Math.round((p.ema_accuracy||0)*100)}%</td>
                  <td>{Math.round(p.ema_latency_ms||0)}</td>
                  <td>{p.attempts}</td>
                  <td>{p.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
