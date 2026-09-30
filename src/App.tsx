import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Header, Footer } from './components/Layout'
import Home from './pages/Home'
import { Products, ProductDetail, NotFound } from './pages/Products'
import { Solutions, SolutionDetail } from './pages/Solutions'
import About from './pages/About'
import Services from './pages/Services'
import Studio from './pages/Studio'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import { getMeta } from './data'

export default function App() {
  const location = useLocation(), first = useRef(true)
  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  useEffect(() => {
    const meta = getMeta(pathname)
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://printocards.com${pathname}`)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.description)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', `https://printocards.com${pathname}`)
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', `https://printocards.com${meta.image}`)
    if (first.current) { first.current = false; return }
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true })
  }, [pathname])
  return <><Header /><main id="main" tabIndex={-1} key={location.pathname}><Routes><Route path="/" element={<Home />} /><Route path="/products" element={<Products />} /><Route path="/products/:slug" element={<ProductDetail />} /><Route path="/solutions" element={<Solutions />} /><Route path="/solutions/:slug" element={<SolutionDetail />} /><Route path="/studio" element={<Studio />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /><Route path="/privacy" element={<Privacy />} /><Route path="/services" element={<Services />} /><Route path="*" element={<NotFound />} /></Routes></main><Footer /></>
}
