import React from 'react'
import './index.css'
import { TopBar, Card } from './components/UI'
import ProgressPanel from './components/ProgressPanel'
import SpeechMatch from './exercises/SpeechMatch'
import Prepositions from './exercises/Prepositions'
import SentenceTF from './exercises/SentenceTF'

export default function App() {
  const [tab, setTab] = React.useState<'speech'|'prep'|'tf'>('speech')
  const tabs = [
    { id: 'speech', label: 'Speech Match' },
    { id: 'prep',   label: 'Prepositions' },
    { id: 'tf',     label: 'Sentence T/F' },
  ]
  const Active = tab === 'speech' ? SpeechMatch : tab === 'prep' ? Prepositions : SentenceTF

  return (
    <div className="min-h-screen bg-stone-100">
      <TopBar tabs={tabs} current={tab} onSelect={setTab} />
      {/* Center the whole app */}
      <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-4xl flex-col items-center justify-start gap-6 px-4 py-8">
        <Card tone="stone">
          <p className="text-sm text-stone-700">
            Pick an exercise from the top bar. Difficulty adapts automatically based on accuracy & speed.
          </p>
        </Card>
        <ProgressPanel />
        <Active />
      </main>
    </div>
  )
}
