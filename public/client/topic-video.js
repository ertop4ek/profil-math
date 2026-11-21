import examples from './type-video-manifest.js';
import {topicKey} from './topic-methods.js';
import {esc} from './ui-shared.js';

// Chapters from the author's published description of Yashchenko 2026, variant 11.
const videoId = '95b1d174db392d4b3a1bd3932f0de298';
const chapters = [
  '00:36', '04:01', '05:09', '06:47', '09:20', '15:03', '16:51',
  '17:48', '22:14', '24:35', '34:12', '37:13', '41:49', '2:23:18',
  '55:13', '1:10:09', '2:10:20', '1:20:25', '1:49:14',
];

export function topicVideo(task) {
  const {ege:number} = task;
  const key = topicKey(task);
  if (Object.hasOwn(examples, key)) {
    const url = new URL('../videos/' + key + '.mp4', import.meta.url).href;
    const caption = examples[key] === task.id ? 'В ролике показано решение текущего условия.' :
      'В ролике разбирается учебный пример этого же типа.';
    return `<details class="topic-video">
      <summary>Видеоразбор · ${esc(task.title)}</summary>
      <p>${caption} Формулы и шаги показаны на экране. Озвучки нет.</p>
      <video controls playsinline preload="none" aria-label="Видеоразбор · ${esc(task.title)}" src="${esc(url)}"></video>
      <a href="${esc(url)}" download>Скачать MP4</a>
    </details>`;
  }

  const chapter = chapters[number - 1];
  if (!chapter) return '';
  const seconds = chapter.split(':').reduce((total, segment) => total * 60 + Number(segment), 0);
  return `<details class="topic-video">
    <summary>Видеоразбор №${number} · ${chapter}</summary>
    <p>Пример по этому номеру из варианта 11 сборника Ященко 2026. Разбор «Профиматики» начинается на отметке ${chapter}.</p>
    <iframe src="https://rutube.ru/play/embed/${videoId}/?t=${seconds}"
      title="Пример решения задания №${number} · Профиматика" loading="lazy"
      allow="fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>
    <a href="https://rutube.ru/video/${videoId}/?t=${seconds}" target="_blank" rel="noopener noreferrer">Открыть на RUTUBE</a>
  </details>`;
}
