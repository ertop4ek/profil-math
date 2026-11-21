import {loadExampleSolution} from './lesson-library.js';
import {esc} from './ui-shared.js';

export function mountLessonPlayer(reader, title) {
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'hint-button';
  open.textContent = 'Открыть пошаговый плеер';
  reader.querySelector('.lesson-kicker').after(open);
  open.addEventListener('click', async () => {
    open.disabled = true;
    const details = reader.querySelector('details[data-example-id]');
    if (details) {
      await loadExampleSolution(details);
      if (!details.querySelector('[data-example-result]').dataset.loaded) {
        open.textContent = 'Повторить загрузку разбора';
        open.disabled = false;
        return;
      }
    }
    if (!open.isConnected) return;
    open.remove();
    renderPlayer(reader, title);
    reader.querySelector('[data-play]')?.focus();
  });
}

function renderPlayer(reader, title) {
  const content = reader.querySelector('.lesson-reader');
  const footer = content.querySelector('.lesson-reader-footer');
  const slides = [];

  // Follow the lesson's reading order, including the full worked example.
  for (const node of [...content.querySelectorAll('p, li, .lesson-formula, .example-math, .lesson-example-visual, .lesson-callout, .lesson-checklist label')]) {
    if (footer.contains(node) || node.closest('.lesson-example-visual') && !node.matches('.lesson-example-visual')) continue;
    const text = (node.getAttribute('aria-label') || node.textContent).trim();
    const visual = node.matches('.lesson-example-visual') ? node.innerHTML : '';
    if (text || visual) slides.push({text, visual});
  }
  if (!slides.length) return;

  const player = document.createElement('section');
  player.className = 'lesson-player';
  player.setAttribute('aria-label', 'Пошаговый разбор мини-урока');
  player.innerHTML = `<h3>Посмотреть разбор по шагам</h3>
    <div class="lesson-player-screen">
      <p class="lesson-kicker">${esc(title)}</p>
      <div data-slide></div>
    </div>
    <label>Шаг разбора <input type="range" min="1" max="${slides.length}" value="1" step="1"></label>
    <div class="lesson-player-controls">
      <button type="button" class="hint-button" data-prev>Назад</button>
      <button type="button" class="ai-button" data-play>Воспроизвести</button>
      <button type="button" class="hint-button" data-next>Дальше</button>
      <output>1 / ${slides.length}</output>
    </div>`;
  content.querySelector('.lesson-kicker').after(player);

  const screen = player.querySelector('[data-slide]');
  const seek = player.querySelector('input');
  const previous = player.querySelector('[data-prev]');
  const next = player.querySelector('[data-next]');
  const play = player.querySelector('[data-play]');
  const counter = player.querySelector('output');
  let index = 0, timer;

  function pause() {
    clearTimeout(timer);
    timer = undefined;
    play.textContent = 'Воспроизвести';
  }
  function show(position) {
    index = position;
    const {text, visual} = slides[index];
    screen.innerHTML = visual || `<p>${esc(text)}</p>`;
    seek.value = index + 1;
    seek.setAttribute('aria-valuetext', `Шаг ${index + 1} из ${slides.length}`);
    counter.value = `${index + 1} / ${slides.length}`;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  }
  function schedule() {
    play.textContent = 'Пауза';
    const seconds = Math.max(5, slides[index].text.split(/\s+/).length / 2.2);
    timer = setTimeout(() => {
      if (!player.isConnected || player.closest('[hidden]') || index === slides.length - 1) {
        pause();
        return;
      }
      show(index + 1);
      schedule();
    }, seconds * 1000);
  }

  function jump(position) {
    pause();
    show(position);
  }
  play.addEventListener('click', () => {
    if (timer !== undefined) return pause();
    if (index === slides.length - 1) show(0);
    schedule();
  });
  previous.addEventListener('click', () => jump(index - 1));
  next.addEventListener('click', () => jump(index + 1));
  seek.addEventListener('input', () => jump(Number(seek.value) - 1));
  show(0);
}
