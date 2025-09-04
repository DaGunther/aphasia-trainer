import { useCallback, useMemo } from 'react'

export function useProgressAPI(base = (import.meta as any).env?.VITE_API_BASE || '') {
  const userId = useMemo(() => {
    let id = localStorage.getItem('aphasia_user_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('aphasia_user_id', id) }
    return id
  }, [])

  const reportAttempt = useCallback(async (exercise:string, attempt:any)=>{
    await fetch(`${base}/api/attempt`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, exercise, ...attempt })
    })
  }, [base, userId])

  const getNext = useCallback(async (exercise:string, options:any = {})=>{
    const res = await fetch(`${base}/api/next`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, exercise, options })
    })
    if (!res.ok) throw new Error(`Backend ${res.status}`)
    return res.json()
  }, [base, userId])

  const getProgress = useCallback(async ()=>{
    const res = await fetch(`${base}/api/progress?user_id=${userId}`)
    if (!res.ok) throw new Error(`Backend ${res.status}`)
    return res.json()
  }, [base, userId])

  return { userId, reportAttempt, getNext, getProgress }
}
