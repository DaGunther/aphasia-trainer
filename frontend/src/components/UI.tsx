import React from 'react'

export function TopBar({
  tabs, current, onSelect,
}: { tabs: {id:string,label:string}[]; current: string; onSelect:(id:any)=>void }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-lg font-semibold tracking-tight text-stone-800">Aphasia Trainer</div>
        <nav className="flex items-center gap-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={()=>onSelect(t.id)}
              className={`rounded-full border-[3px] px-4 py-2 text-sm transition-colors ${
                current===t.id
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-300 bg-stone-50 text-stone-900 hover:bg-stone-100'
              }`}
              aria-current={current===t.id ? 'page' : undefined}
            >{t.label}</button>
          ))}
        </nav>
      </div>
    </header>
  )
}

type Tone = 'amber'|'orange'|'rose'|'stone'
const toneStyles: Record<Tone, {border: string; bg: string; heading: string}> = {
  amber:  { border: 'border-amber-300',  bg: 'bg-amber-50',  heading: 'text-amber-900'  },
  orange: { border: 'border-orange-300', bg: 'bg-orange-50', heading: 'text-orange-900' },
  rose:   { border: 'border-rose-300',   bg: 'bg-rose-50',   heading: 'text-rose-900'   },
  stone:  { border: 'border-stone-300',  bg: 'bg-stone-50',  heading: 'text-stone-900'  },
}

export function Card({
  title, children, footer, tone = 'stone',
}: React.PropsWithChildren<{title?:string, footer?:React.ReactNode, tone?:Tone}>) {
  const t = toneStyles[tone]
  return (
    <section className={`mx-auto w-full max-w-3xl rounded-2xl border-[3px] ${t.border} ${t.bg} p-6 shadow-sm`}>
      {title && <h2 className={`mb-4 text-xl font-semibold ${t.heading}`}>{title}</h2>}
      <div>{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  )
}

export function Pill({ children }: React.PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full border-[3px] border-stone-300 bg-stone-50 px-3 py-1 text-sm text-stone-900">
      {children}
    </span>
  )
}
