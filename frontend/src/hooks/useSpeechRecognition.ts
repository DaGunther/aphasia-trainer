import { useEffect, useRef, useState, useCallback } from 'react'

export default function useSpeechRecognition() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSupported(Boolean(SR))
  }, [])

  const start = useCallback((onResult:(alts:{transcript:string,confidence:number}[])=>void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    recRef.current = rec
    rec.lang = "en-US"
    rec.interimResults = false
    rec.maxAlternatives = 5
    rec.onresult = (e:any) => {
      const alts:any[] = []
      for (let i=0;i<e.results[0].length;i++) alts.push({ transcript: e.results[0][i].transcript, confidence: e.results[0][i].confidence })
      onResult(alts); setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    setListening(true); rec.start()
  }, [])

  const stop = useCallback(() => { recRef.current?.stop?.(); setListening(false) }, [])

  return { supported, listening, start, stop }
}
