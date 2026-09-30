import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type CardStyle = 'orange' | 'ink' | 'citrus'
type Props = { variant: CardStyle; flipped: boolean; name?: string; onReady: (ready: boolean) => void; reducedMotion?: boolean }

type BrandImages = Record<CardStyle, HTMLImageElement>
function artwork(variant: CardStyle, back = false, name?: string, logos?: BrandImages) {
  const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 880
  const ctx = canvas.getContext('2d')!
  const palettes = { orange: ['#f26b35', '#211d1e'], ink: ['#373435', '#fffaf4'], citrus: ['#cbdb3a', '#373435'] }
  const [bg, ink] = palettes[variant]
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1400, 880)
  // A restrained printed texture keeps the digital object tactile.
  for (let i = 0; i < 15000; i++) {
    const x = (i * 137.508) % 1400, y = (i * 73.321) % 880
    ctx.fillStyle = i % 2 ? '#ffffff08' : '#00000008'; ctx.fillRect(x, y, 1.6, 1.6)
  }
  ctx.fillStyle = ink; ctx.textBaseline = 'top'
  const logo = logos?.[variant]
  if (logo?.complete && logo.naturalWidth > 0) ctx.drawImage(logo, 82, 47, 284, 96)
  ctx.font = '500 16px Manrope, sans-serif'; ctx.fillText(back ? 'THE OTHER SIDE OF POSSIBILITY' : 'SMALL CARDS. BIG CONNECTIONS.', 82, 164)
  ctx.strokeStyle = ink; ctx.lineWidth = 3
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.arc(1260, 103, 13 + i * 15, -Math.PI / 2, Math.PI / 2); ctx.stroke()
  }
  if (back) {
    ctx.font = '700 92px Manrope, sans-serif'; ctx.fillText('Nice to', 85, 270); ctx.fillText('meet you.', 85, 375)
    ctx.font = '500 27px Manrope, sans-serif'; ctx.fillText(name || 'Your next connection starts here.', 89, 600)
    ctx.font = '600 22px Manrope, sans-serif'; ctx.fillText('printocards.com', 89, 724)
    ctx.lineWidth = 3
    for (let r = 100; r < 370; r += 28) { ctx.beginPath(); ctx.arc(1190, 560, r, 0, Math.PI * 2); ctx.stroke() }
  } else {
    ctx.font = '800 157px Manrope, sans-serif'; ctx.fillText('good to', 74, 238); ctx.fillText('know you.', 74, 409)
    ctx.font = '600 23px Manrope, sans-serif'; ctx.fillText(name || 'YOUR STORY STARTS HERE', 86, 750)
    ctx.font = '600 23px Manrope, sans-serif'; ctx.fillText('01 / ∞', 1214, 750)
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(84, 705); ctx.lineTo(1315, 705); ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}

export default function CardScene({ variant, flipped, name, onReady, reducedMotion }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const state = useRef({ variant, flipped, name }); state.current = { variant, flipped, name }
  useEffect(() => {
    if (!host.current) return
    const el = host.current
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }) }
    catch { onReady(false); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50); camera.position.set(0, 0, 10.7)
    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const light = new THREE.DirectionalLight(0xffffff, 1.5); light.position.set(-3, 6, 8); scene.add(light)
    const rim = new THREE.DirectionalLight(0xffeadb, .6); rim.position.set(5, -2, 4); scene.add(rim)
    const shape = roundedShape(4.25, 2.67, .16)
    const faceGeometry = new THREE.ShapeGeometry(shape)
    const positions = faceGeometry.getAttribute('position'), uv = faceGeometry.getAttribute('uv')
    for (let i = 0; i < positions.count; i++) uv.setXY(i, (positions.getX(i) + 2.125) / 4.25, (positions.getY(i) + 1.335) / 2.67)
    const edgeGeometry = new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .009, bevelThickness: .008, curveSegments: 14 })
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#e3d6ca', roughness: .45, metalness: .18 })
    const frontMaterial = new THREE.MeshBasicMaterial({ map: artwork(state.current.variant, false, state.current.name), toneMapped: false })
    const backMaterial = new THREE.MeshBasicMaterial({ map: artwork(state.current.variant, true, state.current.name), toneMapped: false })
    const main = new THREE.Group(); main.add(new THREE.Mesh(edgeGeometry, edgeMaterial))
    const front = new THREE.Mesh(faceGeometry, frontMaterial); front.position.z = .047; main.add(front)
    const back = new THREE.Mesh(faceGeometry, backMaterial); back.rotation.y = Math.PI; back.position.z = -.012; main.add(back)
    const group = new THREE.Group(); group.position.y = .3; group.add(main); scene.add(group)
    // Two quieter cards make the main card feel like a tangible collection.
    const rearMats: THREE.MeshStandardMaterial[] = []
    for (let i = 0; i < 2; i++) {
      const m = new THREE.MeshStandardMaterial({ map: artwork(i ? 'citrus' : 'ink', true), roughness: .8 }); rearMats.push(m)
      const rear = new THREE.Mesh(faceGeometry, m)
      rear.position.set(i ? .39 : -.2, i ? .63 : -.64, -.48 - i * .16)
      rear.rotation.z = i ? .17 : -.14; group.add(rear)
    }
    main.rotation.set(-.08, -.2, -.12)
    let frame = 0, visible = true, disposed = false, notified = false, pointerX = 0, pointerY = 0, lastVariant = state.current.variant, lastName = state.current.name, lastTime = 0, localTime = 0
    let logosReady = false, logosChanged = false
    const logos: BrandImages = { orange: new Image(), ink: new Image(), citrus: new Image() }
    Promise.all((Object.entries(logos) as [CardStyle, HTMLImageElement][]).map(([style, img]) => new Promise<void>(resolve => {
      img.onload = () => resolve(); img.onerror = () => resolve()
      img.src = `/brand/printo-logo${style === 'orange' ? '-mono' : style === 'ink' ? '-light' : ''}.svg`
    }))).then(() => { if (!disposed) { logosReady = true; logosChanged = true } })
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.position.z = Math.max(8.6, 5.45 / (2 * Math.tan(THREE.MathUtils.degToRad(16.5)) * camera.aspect)); camera.updateProjectionMatrix(); renderer.setSize(w, h) }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(el); resize()
    const move = (event: PointerEvent) => { if (event.pointerType === 'touch') return; const r = el.getBoundingClientRect(); pointerX = (event.clientX - r.left) / r.width - .5; pointerY = (event.clientY - r.top) / r.height - .5 }
    const reset = () => { pointerX = 0; pointerY = 0 }
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', reset)
    const contextLost = (event: Event) => { event.preventDefault(); visible = false; onReady(false) }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    function animate(time: number) {
      if (disposed || !visible || document.hidden) return
      frame = requestAnimationFrame(animate)
      if (time - lastTime < 1000 / 30) return
      const delta = Math.min((time - lastTime) / 1000, .05); lastTime = time; localTime += delta
      if (lastVariant !== state.current.variant || lastName !== state.current.name || logosChanged) {
        frontMaterial.map?.dispose(); backMaterial.map?.dispose()
        frontMaterial.map = artwork(state.current.variant, false, state.current.name, logos)
        backMaterial.map = artwork(state.current.variant, true, state.current.name, logos)
        frontMaterial.needsUpdate = true; backMaterial.needsUpdate = true
        lastVariant = state.current.variant; lastName = state.current.name
        if (logosChanged) {
          rearMats.forEach((m, i) => { m.map?.dispose(); m.map = artwork(i ? 'citrus' : 'ink', true, undefined, logos); m.needsUpdate = true })
          logosChanged = false
        }
      }
      const targetY = state.current.flipped ? Math.PI - .2 : -.2
      main.rotation.y = THREE.MathUtils.lerp(main.rotation.y, targetY, reducedMotion ? 1 : .12)
      if (!reducedMotion) {
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, pointerX * .38, .07)
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pointerY * .18, .07)
        group.position.y = .3 + Math.sin(localTime * .7) * .08
        group.rotation.z = Math.sin(localTime * .35) * .022
      }
      renderer.render(scene, camera)
      if (!notified && logosReady) { notified = true; onReady(true) }
    }
    const resume = () => { cancelAnimationFrame(frame); if (visible && !document.hidden) frame = requestAnimationFrame(animate) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume() }, { rootMargin: '80px' }); observer.observe(el)
    document.addEventListener('visibilitychange', resume)
    frame = requestAnimationFrame(animate)
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', resume); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', reset)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      for (const material of [frontMaterial, backMaterial, ...rearMats]) { material.map?.dispose(); material.dispose() }
      edgeMaterial.dispose(); edgeGeometry.dispose(); faceGeometry.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
    }
  }, [onReady, reducedMotion])
  return <div className="three-canvas" ref={host} aria-hidden="true" />
}
