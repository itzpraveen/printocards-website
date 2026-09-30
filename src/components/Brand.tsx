export type LogoAppearance = 'default' | 'light' | 'mono'

export function BrandLogo({ appearance = 'default', className = '', alt = '' }: { appearance?: LogoAppearance; className?: string; alt?: string }) {
  return <img className={`brand-logo ${className}`} src={`/brand/printo-logo${appearance === 'default' ? '' : `-${appearance}`}.svg`} width="477" height="162" alt={alt} />
}

export function BrandMark({ className = '' }: { className?: string }) {
  return <img className={`brand-mark ${className}`} src="/brand/printo-mark.svg" width="80" height="117" alt="" aria-hidden="true" />
}
