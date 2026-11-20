# Профиль — тренажёр математики

[Открыть сайт](https://ertop4ek.github.io/profil-math/)

Основная публикация — GitHub Pages. Статическая сборка содержит 2298 задач, подсказки, уроки, локальный прогресс и пробный ЕГЭ.

## Запуск статической версии

Требуется Node.js 24. Выполните npm ci, npm test и npm run build:pages. Для локального просмотра выполните python3 -m http.server 8080 --directory pages-dist и откройте http://localhost:8080/.

Публикация запускается при push в main и вручную через Publish GitHub Pages. Подробности и ограничения находятся в [отчёте](docs/pages-release.md).

## Предыдущая серверная версия

# Профиль — банк задач ЕГЭ-2026

Full web application built with React and Vinext on Cloudflare Workers, with a D1 database. The hosting audience is public, without authentication. The existing mathematics engine, lessons and illustrations remain separate tested modules in `public/client/`.

## Content

2,298 original tasks: 76 models × 30 deterministic numerical variants spanning all 19 exam lines, plus the original 18 tasks. Variant IDs are stable. Short-answer tasks have terminating decimal or integer keys. The catalogue clearly distinguishes original training models from the official FIPI bank, and explains that training difficulty is relative to a topic.

The 2026 numbering and topic structure were verified against FIPI's recommendations and 2026 archive. These sources are linked in the app:

- https://fipi.ru/ege/demoversii-specifikacii-kodifikatory
- https://doc.fipi.ru/navigator-podgotovki/navigator-ege/MR_matematika_ege_2026.pdf

## Features

- Searchable, paginated catalogue with 19 number shortcuts, difficulty and progress filters.
- Training filters by number, subtopic and difficulty; sequential and random selection.
- Five incremental hints per task; solutions appear only after a correct final answer or explicit reveal.
- Safe mathematical parser for numbers, decimals, fractions, powers, square roots, pi, finite root sets, intervals, unions and chained inequalities. No eval.
- All 360 first-part geometry tasks have condition-specific labelled SVG figures; all 240 first-part graph tasks include their condition and marked graph data. Figures can be enlarged.
- Readable high-contrast layout, 18–20px condition text, large controls and responsive navigation.
- Optional step-by-step tutoring in a separate ChatGPT tab: sends the task, graph coordinates, selected request and optional working. No API keys or simulated AI responses. The trainer stays public; ChatGPT may request its own sign-in.
- Browser-local drafts for extended solutions, with manual proof checklists. Only final answers are checked automatically; no expert exam grade is claimed.
- Original task IDs and `profile-math-practice-v1` local storage preserved, including existing progress. Hint-count migration preserves already revealed guidance.

## Learning library

The “Как решать” view now covers every one of the 19 exam lines with prerequisites, formula restrictions, a complete algorithm, an independent example, common mistakes and a final checklist. Each of the 94 training types (76 generated + 18 preserved) has its own focused method. Every task has a seven-lesson route, plus 2–3 direct external resources (33 unique author pages, including collections with video explanations).

Worked examples use a different condition from the active task and reuse the existing validated training models. Their solutions are collapsed until explicitly requested. The original 18 tasks use independent teaching examples. Extra long-form notes cover rationalization, modules/double inequalities and f(t) parameter analysis without the discriminant.

Lesson completion and checklist marks are stored separately in `profile-math-learning-v1`; task state and the five gated hints keep their existing behavior. Lessons are accessible from both training and the dedicated number/type selector. Search, previous/next, completion/unmark and return to the matching task are supported.

External references were inspected on 2026-11-18 and are credited individually. These are author-hosted lessons and collections, not copied videos or official 2026 tasks. External numbering may differ; matching uses mathematical topics. Author sites can impose their own video/login conditions.

## Validation

`npm test` runs 62 checks. The new suite validates every task key and independently evaluates original mathematical conditions for all 2,280 generated variants. Coverage includes root completeness, interval endpoints, financial schedules, vector geometry, brute-force integer constructions and original 18 regression cases.

Lesson browser QA: every exam line produces seven lessons and 2–3 external resources; task-specific lesson and separate worked example; reveal/hidden behavior; detailed guide and rationalization; search/no-results/reset; completion and checkbox persistence after reload; return to the matching training task; wrong/correct answers; 320px/390px layouts and modal sizing with no page or reader overflow.

Previous browser QA: real ChatGPT handoff returned a single-step explanation and question; copy/prompt preview and optional working; five hints, reload persistence, wrong/correct answers; all 12 geometry families at both endpoint variants; enlarged figures; 320px/390px mobile layouts. Previous bank QA: all 57 number/difficulty combinations; catalogue search, no-results, pagination, filters and opening tasks; empty/wrong/correct answers; pi/root notation; graph and diagram rendering; single-step hints; draft and checklist persistence after reload; responsive catalogue and answer submission in 390px and 320px frames, with no horizontal overflow.

## Code

`bank.js` contains the 76 deterministic models and SVG renderers; `catalog.js` merges these with preserved original tasks; `engine.js` parses and compares answers; `app.js` implements the UI; `learning.js` supplies five-step guidance and the ChatGPT handoff; `visuals.js` renders condition-specific illustrations. Authentication is not used.

## Website architecture

The application has real addressable pages: `/`, `/bank`, `/practice/:id`, `/lessons`, `/lessons/:id`, `/methods/:id`, `/progress`, `/saved` and `/about`. Query parameters preserve catalogue filters and lesson context; browser back/forward and direct reload are supported. Task URLs contain no answers or drafts.

`POST /api/check` validates and checks final answers on the server. `GET/PUT /api/progress` stores normalized learner documents in D1 with optimistic revisions to prevent concurrent tab overwrites. Each browser receives a random HttpOnly, SameSite session cookie (Secure and __Host prefix on HTTPS); there is no registration or shared global progress. Device-local state remains available when the network is unavailable. The progress page exports/imports JSON for transfer between devices. Clearing cookies starts a separate anonymous session; there is no account recovery.

D1 is declared as `DB` in `.openai/hosting.json`. Schema is tracked in `db/schema.ts` and SQL migrations in `drizzle/`; migration application belongs to hosting and is never performed by request handlers.

Development: `npm run dev`. Validation: `npm test`, `npx tsc --noEmit`. Production build uses the Sites build helper and emits Worker code in `dist/server` plus assets in `dist/client`; generated build output is not source.

## Локальный запуск

Требуется Node.js 22.13 или новее. Из корня репозитория выполните:

```sh
npm run install:ci
npm run dev
```

Откройте http://localhost:5173. Нажмите «Начать решать», выберите номер в каталоге и откройте карточку задания. Ссылка «К подборке» восстанавливает номер, поиск, сложность, статус и страницу каталога даже после обновления карточки. Раздел «Как решать» доступен по адресу `/lessons`.

Для локального запуска версии Next.js, используемой на Vercel, выполните из корня репозитория:

```sh
node scripts/prepare-vercel.mjs outputs/vercel
cd outputs/vercel
npm install
npm run dev
```

Адрес этой версии по умолчанию — http://localhost:3000. Проверка ответов и синхронизация прогресса в ней используют опубликованный сервер проекта.

## Данные и формат 2026

Сверка тем, типов ответов и критериев с ФИПИ описана в [docs/exam-2026.md](docs/exam-2026.md). Полные записи банка хранятся в lib/bank. Каталог получает публичные условия. Ключи, решение и критерии загружаются отдельным запросом при открытии разбора.

## GitHub Pages

Основная статическая сборка создаётся командой `npm run build:pages`. Разместите содержимое `pages-dist` на статическом хостинге. Для локального просмотра выполните `python3 -m http.server 8080 --directory pages-dist`, затем откройте http://localhost:8080/. В GitHub Pages публикует workflow `.github/workflows/pages.yml`. Отчёт по шагам 8–10 и оставшиеся проверки приведены в [docs/pages-release.md](docs/pages-release.md).
