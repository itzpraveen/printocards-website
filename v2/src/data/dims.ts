import sizes from './image-sizes.json';

/** width/height attributes for a public image, so the browser reserves space before it loads. */
export function dims(src: string): { width?: number; height?: number } {
  const s = (sizes as Record<string, number[]>)[src];
  return s ? { width: s[0], height: s[1] } : {};
}
