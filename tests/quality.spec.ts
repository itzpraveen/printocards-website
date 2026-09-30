import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { products, audiences } from '../src/data'
import { mkdir, writeFile } from 'node:fs/promises'

test('all product and audience pages have working images and enquiry links', async ({ page }) => {
  test.setTimeout(120000)
  for (const item of [...products.map(p => ({ route: `/products/${p.slug}`, name: p.name })), ...audiences.map(a => ({ route: `/solutions/${a.slug}`, name: a.title }))]) {
    await page.goto(item.route)
    await expect(page.getByRole('heading', { level: 1, name: item.name })).toBeVisible()
    await expect(page.locator('main a[href^="/contact?"]').first()).toBeVisible()
    const broken = await page.locator('main img').evaluateAll(images => images.filter(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth === 0).map(i => i.getAttribute('src')))
    expect(broken, item.route).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), item.route).toBeTruthy()
  }
})

test('page templates pass accessibility checks and have no horizontal overflow', async ({ page }, testInfo) => {
  test.setTimeout(120000)
  for (const route of ['/', '/services', '/products', '/products/pvc-id-cards', '/solutions', '/solutions/business', '/about', '/studio', '/contact', '/privacy']) {
    await page.goto(route)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    await mkdir('artifacts/accessibility', { recursive: true })
    await writeFile(`artifacts/accessibility/${testInfo.project.name}${route.replaceAll('/', '-') || '-home'}.json`, JSON.stringify(results.violations, null, 2))
    await testInfo.attach(`accessibility-${route.replaceAll('/', '-') || 'home'}.json`, { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
    expect.soft(results.violations.map(v => ({ id: v.id, count: v.nodes.length, nodes: v.nodes.slice(0, 3).map(n => ({ target: n.target, summary: n.failureSummary })) })), `${route} accessibility`).toEqual([])
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} horizontal overflow`).toBeTruthy()
  }
})

test('capture review artifacts at desktop and phone sizes', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.three-canvas canvas').waitFor({ state: 'visible' })
  await expect(page.locator('.fallback-cards')).toHaveClass(/is-hidden/)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-home.png` })
  await page.goto('/products')
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-products.png` })
  await page.goto('/studio')
  await page.locator('.three-canvas canvas').waitFor({ state: 'visible' })
  await expect(page.locator('.fallback-cards')).toHaveClass(/is-hidden/)
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-studio.png` })
})

test('narrow phone and tablet pages stay within the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Viewport matrix uses the desktop browser context')
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', '/services', '/products', '/products/multicolour-lanyards', '/solutions/institutions', '/studio', '/contact']) {
      await page.goto(route)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px ${route}`).toBeTruthy()
    }
  }
})

test('trailing-slash page visits retain the correct title and canonical URL', async ({ page }) => {
  await page.goto('/products/wooden-cards/')
  await expect(page).toHaveTitle('Wooden cards — Printo')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://printocards.com/products/wooden-cards')
})
