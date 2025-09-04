import React from 'react'

export function TopBar({
  tabs, current, onSelect,
}: { tabs: {id:string,label:string}[]; current: string; onSelect:(id:any)=>void }) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="text-xl font-semibold tracking-tight">Aphasia Trainer</div>
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={()=>onSelect(t.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                current===t.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
              aria-current={current===t.id ? 'page' : undefined}
            >{t.label}</button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function Card({ title, children, footer }:
  React.PropsWithChildren<{title?:string, footer?:React.ReactNode}>
) {
  return (
    <section className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border bg-white p-5 shadow-sm">
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      <div className="prose max-w-none">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  )
}

export function Pill({ children }: React.PropsWithChildren) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">{children}</span>
}
