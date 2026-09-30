import { build } from 'vite'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import react from '@vitejs/plugin-react'

await build({ configFile: false, plugins: [react()], build: { ssr: 'src/entry-server.tsx', outDir: '.ssr', emptyOutDir: true } })
const { render, products, audiences, getMeta, contact } = await import(pathToFileURL(path.resolve('.ssr/entry-server.js')).href)
const template = await readFile('dist/index.html', 'utf8')
const routes = ['/', '/products', '/services', '/solutions', '/studio', '/about', '/contact', '/privacy', ...products.map(p => `/products/${p.slug}`), ...audiences.map(a => `/solutions/${a.slug}`)]
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
for (const route of [...routes, '/404']) {
  const meta = getMeta(route), content = render(route)
  const product = products.find(p => route === `/products/${p.slug}`)
  const schema = product ? { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description, image: `https://printocards.com${product.image}`, brand: { '@type': 'Brand', name: product.category === 'printers' ? product.name.split(' ')[0] : 'Printo' } } : { '@context': 'https://schema.org', '@type': 'Organization', name: 'Printo Cards & Technologies', url: 'https://printocards.com', telephone: contact.tel, email: contact.email, address: { '@type': 'PostalAddress', streetAddress: 'C-19, 3rd Floor, Darussalam Complex, Mavoor Road', addressLocality: 'Calicut', addressRegion: 'Kerala', postalCode: '673004', addressCountry: 'IN' } }
  let html = template.replace('<div id="root"></div>', `<div id="root">${content}</div>`)
    .replace(/<title>.*?<\/title>/, `<title>${escape(meta.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${escape(meta.description)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${escape(meta.title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${escape(meta.description)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1https://printocards.com${route}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1https://printocards.com${meta.image}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1https://printocards.com${route}`)
    .replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
  if (route === '/404') { html = html.replace('</head>', '<meta name="robots" content="noindex" /></head>'); await writeFile('dist/404.html', html); continue }
  const dir = path.join('dist', route); await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, 'index.html'), html)
}
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.filter(r => r !== '/privacy').map(r => `<url><loc>https://printocards.com${r}</loc></url>`).join('')}</urlset>\n`)
await rm('.ssr', { recursive: true, force: true })
console.log(`Pre-rendered ${routes.length} routes and a 404 page.`)
