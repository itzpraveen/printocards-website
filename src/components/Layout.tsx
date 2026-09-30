import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X, ArrowRight, Phone, Mail } from 'lucide-react'
import { contact } from '../data'
import { BrandLogo } from './Brand'

export function Logo({ footer = false }: { footer?: boolean }) { return <Link to="/" className={`logo ${footer ? 'footer-logo' : ''}`} aria-label="Printo home"><BrandLogo appearance={footer ? 'light' : 'default'} alt="Printo Cards & Technologies" /></Link> }
const navItems = [['/products', 'Products'], ['/services', 'Services'], ['/solutions', 'For your world'], ['/studio', 'Card studio'], ['/about', 'Our story']]
export function Header() {
  const [open, setOpen] = useState(false), location = useLocation(), menuRef = useRef<HTMLElement>(null), toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => { const wide = window.matchMedia('(min-width: 681px)'); const close = () => { if (wide.matches) setOpen(false) }; wide.addEventListener('change', close); return () => wide.removeEventListener('change', close) }, [])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const links = menuRef.current?.querySelectorAll<HTMLAnchorElement>('a')
    links?.[0]?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus() }
      if (e.key === 'Tab') {
        const first = links?.[0], last = links?.[links.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); toggleRef.current?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggleRef.current?.focus() }
        else if (document.activeElement === toggleRef.current) { e.preventDefault(); (e.shiftKey ? last : first)?.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key) }
  }, [open])
  return <><a href="#main" className="skip-link">Skip to content</a><header className="site-header"><Logo /><nav className="desktop-nav" aria-label="Main navigation">{navItems.map(([to, label]) => <NavLink to={to} key={to}>{label}{to === '/studio' && <span className="nav-dot" />}</NavLink>)}</nav><Link to="/contact" className="header-cta">Let’s make it yours <ArrowUpRight size={17} /></Link><button ref={toggleRef} className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></header>
    {open && <nav id="mobile-menu" ref={menuRef} className="mobile-menu" aria-label="Mobile navigation">{navItems.map(([to, label], i) => <NavLink to={to} key={to}><span>0{i + 1}</span>{label}<ArrowUpRight /></NavLink>)}<Link to="/contact">Let’s make it yours<ArrowRight /></Link><p>SMALL CARDS. BIG CONNECTIONS.</p><a className="mobile-phone" href={`tel:${contact.tel}`}>{contact.phone}</a></nav>}
  </>
}
export function Footer() {
  return <footer className="site-footer"><div className="footer-top"><div><Logo footer /><p>Small cards. Big connections.<br />Made with care in Kerala.</p></div><div className="footer-links"><span>EXPLORE</span><Link to="/products">All products</Link><Link to="/services">Services & ID solutions</Link><Link to="/solutions">For your world</Link><Link to="/studio">Card studio</Link><Link to="/about">Our story</Link><a href="/printo-product-catalogue.pdf" target="_blank" rel="noreferrer">Product catalogue <ArrowUpRight size={12} /></a></div><div className="footer-links"><span>LET’S CONNECT</span><a href={`tel:${contact.tel}`}><Phone size={14} />{contact.phone}</a><a href={`mailto:${contact.email}`}><Mail size={14} />{contact.email}</a><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">Say hello on WhatsApp <ArrowUpRight size={14} /></a><Link to="/contact">Visit us in Calicut <ArrowUpRight size={14} /></Link></div></div><div className="footer-wordmark" aria-hidden="true">make your mark<span>↗</span></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Printo Cards & Technologies</span><span>Thoughtful print. Real connections.</span><Link to="/privacy">Privacy</Link></div></footer>
}
