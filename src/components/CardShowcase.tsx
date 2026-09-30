import { lazy, Suspense, useEffect, useState, useCallback } from 'react'
import { RotateCw, MoveUpRight, Wifi } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import type { CardStyle } from './CardScene'
import { BrandLogo } from './Brand'
const CardScene = lazy(() => import('./CardScene'))

export function CardShowcase({ studio = false, name, variant: externalVariant, onVariant }: { studio?: boolean; name?: string; variant?: CardStyle; onVariant?: (v: CardStyle) => void }) {
  const [localVariant, setLocalVariant] = useState<CardStyle>('orange')
  const variant = externalVariant || localVariant
  const [flipped, setFlipped] = useState(false), [mounted, setMounted] = useState(false), [ready, setReady] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => { let active = true; document.fonts.ready.then(() => { if (active) setMounted(true) }); return () => { active = false } }, [])
  const onReady = useCallback((value: boolean) => setReady(value), [])
  const changeVariant = (value: CardStyle) => { setLocalVariant(value); onVariant?.(value) }
  return <div className={`card-showcase ${studio ? 'studio-showcase' : ''}`}>
    <div className="scene-orbit orbit-one" /><div className="scene-orbit orbit-two" />
    <div className={`fallback-cards ${ready ? 'is-hidden' : ''}`} aria-hidden="true">
      <div className="fallback-card rear-card"><BrandLogo appearance="light" /><strong>made to<br />belong.</strong></div>
      <div className={`fallback-card front-card ${variant} ${flipped ? 'flipped' : ''}`}><span><BrandLogo appearance={variant === 'ink' ? 'light' : variant === 'orange' ? 'mono' : 'default'} /> <Wifi size={24} /></span><strong>{flipped ? <>nice to<br />meet you.</> : <>good to<br />know you.</>}</strong><small>{name || 'YOUR STORY STARTS HERE'} <MoveUpRight size={15} /></small></div>
    </div>
    {mounted && <Suspense fallback={null}><CardScene variant={variant} flipped={flipped} name={name} onReady={onReady} reducedMotion={!!reduced} /></Suspense>}
    <div className="scene-shadow" />
    <span className="scene-label"><span /> A LITTLE CARD. ENDLESS POSSIBILITIES.</span>
    <div className="scene-controls">
      <div className="swatch-group" role="group" aria-label="Card colour">
        {(['orange', 'ink', 'citrus'] as CardStyle[]).map(v => <button key={v} className={`swatch ${v} ${variant === v ? 'selected' : ''}`} aria-label={`${v === 'orange' ? 'Orange' : v === 'ink' ? 'Ink' : 'Citrus'} card colour`} aria-pressed={variant === v} onClick={() => changeVariant(v)} />)}
        <span>{variant === 'orange' ? 'A bold beginning' : variant === 'ink' ? 'Quiet confidence' : 'Fresh perspective'}</span>
      </div>
      <button className="flip-button" onClick={() => setFlipped(!flipped)} aria-label="Flip card" aria-pressed={flipped}><RotateCw size={16} /><span>Flip the card</span></button>
    </div>
  </div>
}
