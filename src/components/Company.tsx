import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Eyebrow, TextLink } from './UI'

export function CompanyCredentials({ compact = false }: { compact?: boolean }) {
  return <section className={`section company-credentials ${compact ? 'credentials-compact' : ''}`}>
    <div className="credentials-copy"><Eyebrow>PRINTO CARDS & TECHNOLOGIES</Eyebrow><h2>Made in Kerala.<br /><span className="muted">Built on experience.</span></h2>{!compact && <p>PVC, ID and smart card manufacturing, with the people, printing technology and production capability to bring your whole project together.</p>}<TextLink to="/about">Get to know Printo</TextLink></div>
    <div className="credentials-facts"><div><strong>16<span>+</span></strong><p>Years of experience in<br />cards & identification</p></div><div><strong className="iso-value">ISO<br /><span>9001:2015</span></strong><p>Certified company.<br />Quality at every stage.</p></div></div>
  </section>
}

const industries = [
  ['Corporate', 'Employee, visitor and professional ID card printing.', '/solutions/business'],
  ['Education', 'Student and staff IDs for schools, colleges and campuses.', '/solutions/institutions'],
  ['Healthcare', 'Hospital OP cards, patient registration and staff identification.', '/products/hospital-op-cards'],
  ['Press & media', 'Press identification, professional credentials and event badges.', '/products/pvc-id-cards'],
  ['Retail', 'Loyalty / customer cards, memberships, privilege and gift programmes.', '/solutions/business'],
  ['Government', 'Departmental staff and authorised programme ID card printing.', '/solutions/institutions'],
  ['Financial applications', 'Card personalisation for customer and institutional programmes.', '/solutions/business'],
  ['Hospitality', 'Hotel keycards, guest access and branded membership experiences.', '/products/pvc-hotel-key-cards'],
]
export function IndustryList() {
  return <section className="section industry-section"><div className="section-heading"><div><Eyebrow>ID CARDS WE UNDERTAKE</Eyebrow><h2>One specialist.<br /><span>So many worlds.</span></h2></div><p>For the people you welcome,<br />the teams you support and the customers you serve.</p></div><div className="industry-list">{industries.map(([name, copy, href], i) => <Link key={name} to={href}><span className="industry-index">0{i + 1}</span><div><h3>{name}</h3><p>{copy}</p></div><ArrowUpRight size={22} /></Link>)}</div></section>
}

export function QualitySection() {
  const checks = [['Quality assurance', 'Quality control follows each project through designing, artwork, printing and fusing. Our inspectors check the details that affect the finished card.'], ['Original thick PVC cards', 'Choose the appropriate PVC stock and thickness for your application, including 20–30 mil options and standard 30 mil cards.'], ['Scratch-free surface', 'Surface inspection checks printed cards for visible scratches and finish defects before dispatch.'], ['Waterproof surface', 'PVC card surfaces are checked for water resistance, alongside durability and tear resistance.'], ['Dual-side multicolour print', 'Use both sides for your identity, contact details and essential information, with consistent colour and a considered layout.']]
  return <section className="section quality-section"><div className="quality-intro"><Eyebrow>WHY PRINTO CARDS</Eyebrow><h2>Quality you can<br /><span className="muted">hold in your hand.</span></h2><p>Quality products. Thoughtful service. Support before and after your order. Our manufacturing team brings these together at every stage.</p></div><div className="quality-list">{checks.map(([name, copy], i) => <div key={name}><span>0{i + 1}</span><div><h3>{name}</h3><p>{copy}</p></div></div>)}</div></section>
}
