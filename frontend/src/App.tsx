import React from 'react'
import './index.css'
import { TopBar, Card } from './components/UI'
import ProgressPanel from './components/ProgressPanel.tsx'
import SpeechMatch from './exercises/SpeechMatch.tsx'
import Prepositions from './exercises/Prepositions.tsx'
import SentenceTF from './exercises/SentenceTF.tsx'

export default function App() {
  const [tab, setTab] = React.useState<'speech'|'prep'|'tf'>('speech')
  const tabs = [
    { id: 'speech', label: 'Speech Match' },
    { id: 'prep',   label: 'Prepositions' },
    { id: 'tf',     label: 'Sentence T/F' },
  ]
  const Active = tab === 'speech' ? SpeechMatch : tab === 'prep' ? Prepositions : SentenceTF

  return (
    <div className="min-h-screen bg-neutral-100 pb-10">
      <TopBar tabs={tabs} current={tab} onSelect={setTab} />
      <main className="px-4">
        <ProgressPanel />
        <Card>
          <p className="text-sm text-neutral-700">
            Pick an exercise from the top bar. Difficulty adapts automatically based on accuracy & speed.
          </p>
        </Card>
        <Active />
      </main>
    </div>
  )
}
