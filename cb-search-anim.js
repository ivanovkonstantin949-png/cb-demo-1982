(() => {
'use strict';
const TEXTS = ['Поиск по 1980 играм', 'Например, Genshin Impact', 'Например, Aion 2', 'Например, Dota 2', 'Например, League of Legends', 'Например, Apex Legends', 'Например, Valorant', 'Например, Counter-Strike 2', 'Например, World of Warcraft', 'Например, Minecraft', 'Например, ARC Raiders', 'Например, Fortnite', 'Например, Bodycam', 'Например, GTA 6'];
const SELECTOR = 'header input[placeholder*="Поиск по"], header input[type="search"], header input[name="query"], #header input[name="query"]';
const HUES = ['#9147ff', '#ff6b9d', '#32cbbb', '#ffbd59', '#65aaff'];
function init(input) {
  if (input.dataset.cbSearchAnim) return;
  input.dataset.cbSearchAnim = '1';
  input.classList.add('cb-sa-wide');
  const layer = document.createElement('div');
  layer.className = 'cb-sa-overlay';
  layer.setAttribute('aria-hidden', 'true');
  layer.hidden = true;
  document.body.append(layer);
  const caret = document.createElement('i');
  caret.className = 'cb-sa-caret';
  let timer, frame, idx = 0, chars = [], count = 0, old = input.value;
  const sparks = new Set();
  const idle = () => !document.hidden && !input.value && document.activeElement !== input;
  const later = (fn, ms) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
  function position() {
    frame = 0;
    const rect = input.getBoundingClientRect(), css = getComputedStyle(input);
    input.classList.remove('cb-sa-input');
    const color = getComputedStyle(input, '::placeholder').color;
    const alpha = getComputedStyle(input, '::placeholder').opacity;
    if (!layer.hidden) input.classList.add('cb-sa-input');
    const left = parseFloat(css.borderLeftWidth) + parseFloat(css.paddingLeft);
    const right = parseFloat(css.borderRightWidth) + parseFloat(css.paddingRight);
    const top = parseFloat(css.borderTopWidth) + parseFloat(css.paddingTop);
    Object.assign(layer.style, {
      left: rect.left + left + 'px', top: rect.top + top - 4 + 'px',
      width: Math.max(0, rect.width - left - right) + 'px',
      height: Math.max(0, rect.height - top - parseFloat(css.paddingBottom) - parseFloat(css.borderBottomWidth)) + 'px',
      font: css.font, letterSpacing: css.letterSpacing, textAlign: css.textAlign,
      color, opacity: alpha, visibility: rect.width && rect.height ? 'visible' : 'hidden'
    });
  }
  function reposition() {
    if (!document.hidden && !frame) frame = requestAnimationFrame(position);
  }
  function stop() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    frame = 0;
    layer.hidden = true;
    layer.classList.remove('cb-sa-wave');
    input.classList.remove('cb-sa-input');
  }
  function start() {
    if (!idle()) return stop();
    const text = Array.from(TEXTS[idx++ % TEXTS.length]);
    const t0 = performance.now();
    layer.replaceChildren();
    layer.classList.remove('cb-sa-wave');
    chars = text.map((letter, i) => {
      const span = document.createElement('span');
      span.className = 'cb-sa-letter';
      span.textContent = span.dataset.letter = letter;
      span.style.setProperty('--delay', i * 1500 / Math.max(1, text.length - 1) + 'ms');
      return span;
    });
    count = 0;
    layer.append(caret);
    layer.hidden = false;
    position();
    const avg = 2000 / text.length;
    const jitter = Math.min(avg - 60, 140 - avg);
    const steps = text.map(() => avg);
    for (let i = 0; i + 1 < steps.length; i += 2) {
      const delta = (Math.random() * 2 - 1) * jitter;
      steps[i] += delta; steps[i + 1] -= delta;
    }
    function type() {
      if (!idle()) return stop();
      layer.insertBefore(chars[count++], caret);
      if (count < chars.length) later(type, steps[count]);
      else {
        layer.classList.add('cb-sa-wave');
        later(erase, Math.max(0, 10000 - (performance.now() - t0)));
      }
    }
    function erase() {
      if (!idle()) return stop();
      layer.classList.remove('cb-sa-wave');
      if (count) {
        chars[--count].remove();
        later(erase, 800 / chars.length);
      } else start();
    }
    later(type, steps[0]);
  }
  function resume() {
    stop();
    if (idle()) { idx = 0; later(start, 1500); }
  }
  function burst(n) {
    if (document.hidden || !input.getClientRects().length) return;
    const rect = input.getBoundingClientRect(), css = getComputedStyle(input);
    const ruler = document.createElement('span');
    ruler.style.cssText = 'position:fixed;visibility:hidden;white-space:pre;pointer-events:none';
    ruler.style.font = css.font;
    ruler.style.letterSpacing = css.letterSpacing;
    ruler.textContent = input.value.slice(0, input.selectionStart ?? input.value.length);
    document.body.append(ruler);
    const inset = parseFloat(css.paddingLeft) + parseFloat(css.borderLeftWidth);
    const x = rect.left + Math.max(inset, Math.min(rect.width - parseFloat(css.paddingRight), inset + ruler.getBoundingClientRect().width - input.scrollLeft));
    const y = rect.top + rect.height / 2;
    ruler.remove();
    const total = Math.min(40, n * (3 + Math.floor(Math.random() * 3)));
    for (let i = 0; i < total; i++) {
      if (sparks.size >= 40) { const oldest = sparks.values().next().value; oldest.remove(); sparks.delete(oldest); }
      const p = document.createElement('i');
      const angle = Math.random() * Math.PI * 2, dist = 20 + Math.random() * 40;
      p.className = 'cb-sa-particle';
      p.setAttribute('aria-hidden', 'true');
      p.style.cssText = `left:${x}px;top:${y}px;background:${HUES[i % HUES.length]};border-radius:${Math.random() > .5 ? '50%' : '1px'};--x:${Math.cos(angle) * dist}px;--y:${Math.sin(angle) * dist}px;--turn:${Math.random() * 240 - 120}deg;--life:${500 + Math.random() * 200}ms`;
      const remove = () => { p.remove(); sparks.delete(p); };
      p.addEventListener('animationend', remove, {once:true});
      sparks.add(p); document.body.append(p);
    }
  }
  input.addEventListener('focus', stop);
  input.addEventListener('blur', resume);
  input.addEventListener('input', event => {
    stop();
    if (!event.isComposing && event.inputType?.startsWith('insert')) burst(Array.from(event.data || '').length || Math.max(0, input.value.length - old.length));
    old = input.value;
    if (idle()) resume();
  });
  document.addEventListener('visibilitychange', () => {
    stop();
    sparks.forEach(p => p.remove()); sparks.clear();
    if (!document.hidden) resume();
  });
  window.addEventListener('resize', reposition, {passive:true});
  window.addEventListener('scroll', reposition, {passive:true, capture:true});
  new ResizeObserver(reposition).observe(input);
  new MutationObserver(reposition).observe(document.documentElement, {attributes:true, attributeFilter:['class','data-cbt','data-theme']});
  document.fonts?.ready.then(reposition);
  start();
}
const boot = () => document.querySelectorAll(SELECTOR).forEach(init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
else boot();
})();
