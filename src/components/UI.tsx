import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, Plus, Minus } from 'lucide-react'
import type { Product } from '../data'
import { categories, faqs } from '../data'

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) return
    el.classList.add('reveal-pending')
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { el.classList.remove('reveal-pending'); observer.disconnect() } }, { threshold: .08 })
    observer.observe(el); return () => observer.disconnect()
  }, [])
  return <div className={`reveal ${className}`} ref={ref} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}
export function ButtonLink({ to, children, secondary = false, className = '' }: { to: string; children: ReactNode; secondary?: boolean; className?: string }) {
  return <Link to={to} className={`button ${secondary ? 'button-outline' : ''} ${className}`}>{children}<ArrowUpRight size={18} /></Link>
}
export function TextLink({ to, children }: { to: string; children: ReactNode }) { return <Link className="text-link" to={to}>{children}<ArrowUpRight size={18} /></Link> }
export function Eyebrow({ children, number }: { children: ReactNode; number?: string }) { return <div className="eyebrow">{number && <span className="section-number">{number}</span>}{children}</div> }
export function ProductTile({ product, index = 0 }: { product: Product; index?: number }) {
  return <Reveal delay={(index % 3) * 55}><Link to={`/products/${product.slug}`} className="product-tile">
    <div className={`product-image ${product.tone}`}><img src={product.image} alt={product.name} loading="lazy" width="600" height="500" /><span className="product-arrow"><ArrowUpRight size={22} /></span></div>
    <div className="product-tile-meta"><span>{categories.find(c => c.id === product.category)?.name}</span><span>Made for your world</span></div>
    <h3>{product.name}</h3><p>{product.tagline}</p>
  </Link></Reveal>
}
export function FAQ({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(0)
  return <section className="section faq-section"><Reveal><Eyebrow number="05">A LITTLE CLARITY</Eyebrow><h2>Good questions.<br /><span className="muted">Straight answers.</span></h2><p className="section-intro">Something else on your mind?</p><TextLink to="/contact">Let’s talk about it</TextLink></Reveal>
    <div className="faq-list">{(compact ? faqs.slice(0, 3) : faqs).map(([q, a], i) => <div className={`faq-item ${open === i ? 'open' : ''}`} key={q}>
      <h3><button aria-expanded={open === i} aria-controls={`faq-answer-${i}`} onClick={() => setOpen(open === i ? null : i)}>{q}{open === i ? <Minus size={19} /> : <Plus size={19} />}</button></h3>
      <div id={`faq-answer-${i}`} hidden={open !== i}><p>{a}</p></div>
    </div>)}</div>
  </section>
}
export function ProjectCTA() {
  return <section className="project-cta"><div className="cta-orbit" aria-hidden="true" /><div><Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow><h2>Let’s make<br />a connection<span>↗</span></h2></div><div className="cta-aside"><p>An idea, a question, or a whole project.<br />We’d love to hear it.</p><ButtonLink to="/contact" className="button-dark">Tell us what you have in mind</ButtonLink></div></section>
}
export function Breadcrumb({ items }: { items: { text: string; to?: string }[] }) { return <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link>{items.map((item, i) => <span key={i}><ArrowRight size={12} />{item.to ? <Link to={item.to}>{item.text}</Link> : <span aria-current="page">{item.text}</span>}</span>)}</nav> }
