import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import { audiences, products } from '../data'
import { Breadcrumb, Eyebrow, ButtonLink, ProductTile, ProjectCTA, Reveal, FAQ } from '../components/UI'
import { Process } from './Home'
import { NotFound } from './Products'

export function Solutions() {
  return <><section className="section page-heading"><Breadcrumb items={[{ text: 'For your world' }]} /><Eyebrow>YOU BRING THE PEOPLE. WE BRING THE POSSIBILITIES.</Eyebrow><h1>Every world.<br /><span className="muted">A place to belong.</span></h1><p className="page-intro">Your first business card or your next campus-wide ID programme.<br />It starts with understanding what matters to you.</p></section><section className="section solution-list">{audiences.map((a, i) => <Reveal key={a.slug}><Link to={`/solutions/${a.slug}`} className="solution-row"><span className="solution-num">0{i + 1}</span><div className="solution-row-copy"><Eyebrow>{a.eyebrow}</Eyebrow><h2>{a.label}.</h2><p>{a.short}</p><span className="text-link">Explore your possibilities <ArrowUpRight size={18} /></span></div><div className={`solution-row-image ${a.color}`}><img src={`/images/${a.image}.webp`} alt={`Printo products for ${a.label.toLowerCase().replace('for ', '')}`} loading="lazy" width="500" height="350" /></div></Link></Reveal>)}</section><ProjectCTA /></>
}
export function SolutionDetail() {
  const { slug } = useParams(), a = audiences.find(a => a.slug === slug)
  if (!a) return <NotFound />
  return <><section className="section solution-detail"><Breadcrumb items={[{ text: 'For your world', to: '/solutions' }, { text: a.label }]} /><div className="solution-detail-grid"><div><Eyebrow>{a.eyebrow}</Eyebrow><h1>{a.title}</h1><p>{a.description}</p><ButtonLink to={`/contact?audience=${a.slug}`}>{a.cta}</ButtonLink></div><div className={`solution-detail-visual ${a.color}`}><span>{a.slug === 'individuals' ? 'hello.' : a.slug === 'business' ? 'belong.' : a.slug === 'institutions' ? 'together.' : 'grow.'}</span><img src={`/images/${a.image}.webp`} alt={a.title} width="700" height="600" /></div></div><div className="solution-points">{a.points.map(p => <div key={p}><Check size={19} /><span>{p}</span></div>)}</div></section><section className="section solution-recommendations"><div className="section-heading"><div><Eyebrow>A GOOD PLACE TO START</Eyebrow><h2>Picked for your world.</h2></div><Link to="/products" className="text-link">Browse everything <ArrowUpRight size={18} /></Link></div><div className="catalogue-grid">{a.items.map((slug, i) => <ProductTile key={slug} product={products.find(p => p.slug === slug)!} index={i} />)}</div></section><Process /><FAQ compact /><ProjectCTA /></>
}
