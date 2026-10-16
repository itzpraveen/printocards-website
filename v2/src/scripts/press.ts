// Headlines "press" out to full width as they arrive, like a card going through the laminator.
export function hold(el: HTMLElement) {
  el.style.transform = 'scaleX(.72)';
  el.style.opacity = '0';
}

export function press(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.style.transition = 'none';
  hold(el);
  void el.offsetWidth;
  el.style.transition = '';
  el.style.transform = '';
  el.style.opacity = '1';
}
