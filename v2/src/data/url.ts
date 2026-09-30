// The site can live at a domain root (printocards.com) or under a sub-path (GitHub Pages
// serves it at /printocards-website/). Every root-relative asset goes through asset().
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const asset = (path: string) => (path.startsWith('/') ? `${BASE}${path}` : path);

/** A preview build (e.g. GitHub Pages) must not be indexed in place of the real site. */
export const isPreview = import.meta.env.PUBLIC_PREVIEW === '1';
