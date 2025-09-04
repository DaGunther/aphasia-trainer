import { useCallback, useState } from 'react'

export default function useItemQueue<T>(
  exercise: string,
  fetchFn: (exercise: string, options: any) => Promise<any>,
  mapFn: (json: any) => T[]
) {
  const [queue, setQueue] = useState<T[]>([])
  const [index, setIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const refill = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchFn(exercise, { count: 5 })
      const items = mapFn(data)
      setQueue(items)
      setIndex(0)
    } finally {
      setLoading(false)
    }
  }, [exercise, fetchFn, mapFn])

  const current: T | undefined = queue[index]

  const next = useCallback(async () => {
    const nextIdx = index + 1
    if (nextIdx < queue.length) setIndex(nextIdx)
    else await refill()
  }, [index, queue.length, refill])

  const ensurePrefetch = useCallback(async () => {
    if (queue.length === 0) {
      await refill()
    } else if (queue.length - index <= 2) {
      const data = await fetchFn(exercise, { count: 5 })
      const items = mapFn(data)
      setQueue(q => q.slice(index).concat(items))
      setIndex(0)
    }
  }, [queue.length, index, refill, fetchFn, mapFn, exercise])

  return { current, next, refill, ensurePrefetch, loading }
}
