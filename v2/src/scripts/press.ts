// Headlines "press" from condensed to wide as they arrive, like a card going through the laminator.
export function hold(el: HTMLElement) {
  el.style.setProperty('--wdth', '62');
  el.style.opacity = '0';
}

export function press(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.style.transition = 'none';
  hold(el);
  void el.offsetWidth;
  el.style.transition = '';
  el.style.setProperty('--wdth', el.dataset.press || '125');
  el.style.opacity = '1';
}
