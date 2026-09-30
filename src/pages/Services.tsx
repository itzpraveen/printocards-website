import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import { Breadcrumb, Eyebrow, Reveal, ButtonLink, TextLink, ProjectCTA } from '../components/UI'
import { CompanyCredentials, IndustryList } from '../components/Company'

const services = [
  { name: 'ID solutions', copy: 'A complete identification programme, from the first artwork to the card your people carry. Employee, student, professional, press and government ID card printing, with matching accessories.', terms: ['Personalised ID cards', 'Vertical & horizontal formats', 'Dual-side multicolour print'], image: 'legacy/id-solutions', href: '/products/pvc-id-cards' },
  { name: 'PVC card solutions', copy: 'PVC card manufacturing and personalisation for everyday identification, loyalty, membership and privilege programmes. Choose the stock, thickness and finish that suit your application.', terms: ['Original thick PVC cards', 'Glossy, matte & metallic finishes', 'Blank, colour & composite cards'], image: 'legacy/colour-pvc-cards', href: '/products?category=pvc' },
  { name: 'Pre-printed cards', copy: 'Keep your brand consistent across every batch. Pre-printed PVC cards for hospital OP registration, customer loyalty, memberships and gifting, ready for the details that make each card personal.', terms: ['Hospital OP cards', 'Loyalty / customer cards', 'Gift, privilege & membership cards'], image: 'pre-printed-cards', href: '/products/pre-printed-cards' },
  { name: 'Smart cards & hotel keycards', copy: 'Connect a physical card to a digital experience. NFC for introductions; MIFARE, RFID and proximity cards for compatible readers; hotel keycards matched to your door-lock system.', terms: ['NFC · MIFARE · RFID', '125 kHz proximity cards', 'LF / HF hotel access'], image: 'pvc-hotel-key-cards', href: '/products?category=smart' },
  { name: 'ID card printers & consumables', copy: 'Bring card personalisation in-house with Evolis, Zebra, IDP and Entrust printers. Complete your setup with blank cards and the ribbons your exact printer configuration needs.', terms: ['Direct-to-card & retransfer printing', 'YMCKO, YMCKT-KT & monochrome', 'Half-panel ribbons'], image: 'legacy/printer-consumables', href: '/products?category=printers', extra: { label: 'Explore printer consumables', href: '/products/printer-consumables' } },
  { name: 'ID card accessories', copy: 'Finish the whole identification kit. Multicolour satin lanyards, card holders, clips and pins, ID card reels and yoyo with dome stickers. Add wristbands, badges and keychains for your events.', terms: ['Custom lanyards & fittings', 'Card holders, clips & pins', 'ID card reels & event essentials'], image: 'legacy/card-accessories', href: '/products?category=accessories' },
]

export default function Services() {
  return <>
    <section className="section page-heading services-heading">
      <Breadcrumb items={[{ text: 'Services' }]} />
      <div className="services-intro-grid"><div><Eyebrow>GET YOUR CARD CUSTOMISED</Eyebrow><h1>Card manufacturing.<br /><span className="muted">Complete ID solutions.</span></h1><p className="page-intro">From one personal idea to an organisation’s entire identification programme. Cards, printing, technology and the finishing touches, brought together by Printo.</p><ButtonLink to="/contact">Let’s build your solution</ButtonLink></div><div className="services-intro-photo"><img src="/images/legacy/metallic-pvc-cards.webp" alt="A personalised metallic-finish PVC card held in one hand" width="1024" height="712" fetchPriority="high" /><span>SMALL FORMAT. EVERY DETAIL CONSIDERED.</span></div></div>
    </section>
    <CompanyCredentials compact />
    <section className="section services-list"><div className="section-heading"><div><Eyebrow>PRODUCTS & SERVICES</Eyebrow><h2>Everything your<br /><span className="muted">card needs to be.</span></h2></div><TextLink to="/products">Browse the full collection</TextLink></div>
      {services.map((s, i) => <Reveal key={s.name}><article className="service-detail-row"><span className="service-index">0{i + 1}</span><div className="service-row-image"><img src={`/images/${s.image}.webp`} alt={s.name} loading="lazy" width="600" height="440" /></div><div className="service-row-copy"><h3>{s.name}</h3><p>{s.copy}</p><ul>{s.terms.map(t => <li key={t}><Check size={14} />{t}</li>)}</ul><div className="service-actions"><Link to={s.href} className="text-link">Explore {i === 4 ? 'card printers' : 'products'} <ArrowUpRight size={16} /></Link>{s.extra && <Link to={s.extra.href} className="text-link">{s.extra.label}<ArrowUpRight size={16} /></Link>}</div></div></article></Reveal>)}
    </section>
    <IndustryList />
    <section className="section service-support"><Eyebrow>BEFORE THE FIRST PRINT. AFTER THE LAST.</Eyebrow><h2>A team behind<br /><span className="muted">every card.</span></h2><p>Our skilled technicians help you choose materials, artwork and card technology. A well-equipped manufacturing facility supports high-volume production, while quality checks follow your project through design, printing and fusing. Talk to us for pre- and post-sales support, repeat orders and ongoing supplies.</p><TextLink to="/about">Our approach to quality</TextLink></section>
    <ProjectCTA />
  </>
}
