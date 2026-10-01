// Choices a visitor makes in the story (finish, name) travel to the quote form.
export type Finish = 'glossy' | 'matte' | 'frosted' | 'uv';

export const DEFAULT_NAME = 'John Doe';

export const state = {
  finish: 'glossy' as Finish,
  name: DEFAULT_NAME,
  touched: false,
};

export const bus = new EventTarget();

export function setFinish(f: Finish) {
  state.finish = f;
  state.touched = true;
  bus.dispatchEvent(new Event('finish'));
}

export function setName(n: string) {
  state.name = n;
  state.touched = true;
  bus.dispatchEvent(new Event('name'));
}

/** Scroll position through the story, 0..4 (one unit per chapter). */
export const story = { s: 0 };
