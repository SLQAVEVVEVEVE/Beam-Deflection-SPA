# Beam Deflection SPA (React + TS + Vite)

Гостевой интерфейс для каталога балок с фильтрами, PWA и сборкой под GitHub Pages и Tauri.

## Быстрый старт

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (прокси на http://localhost:3000/api)
npm run build      # production + service worker
npm run preview
npm run deploy     # выкладка из dist в gh-pages (перед этим выставьте VITE_BASE_PATH=/ИмяРепозитория/)
```

## API и окружение

- `VITE_API_BASE` — полный базовый адрес API для веб-версии (например, `http://192.168.0.10:3000/api`). По умолчанию `/api` через прокси Vite.
- `VITE_TAURI_API_BASE` — адрес API для десктоп-сборки Tauri (используйте IP локальной сети, не `localhost`).
- `VITE_MINIO_PUBLIC` — CDN/MinIO для картинок балок (дефолт `http://localhost:9000/beam-deflection/`).
- `VITE_BASE_PATH` — базовый путь билда (например, `/RepoName/` для GitHub Pages). Он автоматически прокидывается в `BrowserRouter` и PWA-манифест.

## Страницы

- `/` — промо-блок с CTA.
- `/beams` — список балок, фильтрация, вывод количества и источника (API/mock).
- `/beams/:id` — карточка балки с изображением и характеристиками.

## Состояние фильтров (Redux Toolkit)

- Срез `filters` хранит `current` и `lastApplied`, поддерживает DevTools.
- Значения фильтров сохраняются в `localStorage` и восстанавливаются при возврате на страницу или в PWA.
- Применение фильтров — кнопка «Применить» в форме или поиск Enter/кнопка; сброс возвращает к `perPage=12`, `page=1`.

## Адаптивность и сетка

- Контент шириной до 1200px, карточки имеют минимум 280px и изображение 132×160px (`src/App.css`).
- Список балок: 1 колонка на мобиле, 2 на ≥768px, 3 на ≥992px (комментарий в `BeamsListPage.tsx`).
- Детали балки: грид 3→2→1 колонки при 992px и 576px; кнопки растягиваются на 100% на мобиле.
- Главная: заголовок 42→34→28px при 992px/576px, кнопки на мобиле во всю ширину.

## PWA и GitHub Pages

- `vite-plugin-pwa` генерирует `sw.js` и манифест (`public/manifest.webmanifest`), регистрация в `src/main.tsx` (`registerSW`).
- Иконки: `public/icons/icon.svg` + `logo.png` как 192/512.
- Для Pages: билд с `VITE_BASE_PATH=/RepoName/`, затем `npm run deploy` (используется `gh-pages -d dist`).
- Установка PWA: открыть собранную страницу, нажать «Установить приложение»/«Добавить на рабочий стол».

## Tauri

- Фронтенд готов к десктоп-сборке: укажите `VITE_TAURI_API_BASE` с IP машины с API и соберите Tauri (нужны `@tauri-apps/cli` и `src-tauri`).
- При работе через локальную сеть сравнивайте IP в консоли API и в `VITE_TAURI_API_BASE`; фронтенд не использует `localhost` в Tauri-режиме.

## Структура

- `src/store` — Redux store/hooks/filters slice.
- `src/services/api.ts` — выбор базового URL для web/Tauri, fallback на mock.
- `src/components` — карточки, фильтры, навигация.
- `src/pages` — страницы каталога, главная, детали.

## Проверка

```bash
npm run build   # проверка TS и сборки + service worker
```

Распространённые метки проблем: если API недоступно — бейдж `Mock`, если изображения отсутствуют — дефолтный плейсхолдер.
