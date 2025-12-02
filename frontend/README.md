# Beam Deflection SPA (React + TS + Vite)

Фронтенд для просмотра балок и их параметров. Работает с Rails API через прокси `/api` и умеет падать в mock, если сервис недоступен.

## Запуск
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 (проксируется на http://localhost:3000/api)
```

Сборка:
```bash
npm run build
```

## Страницы
- `/` — статический экран с описанием системы.
- `/beams` — список балок, фильтры: название, материал, диапазоны E (GPa), J (cm⁴), допустимый прогиб, дата создания. Запрос на `/api/beams` через прокси, при ошибке — mock.
- `/beams/:id` — детали балки. Тянет картинку из MinIO-URL, если она есть; если поле пустое — дефолтный плейсхолдер.

## Фичи
- Navbar + кастомный breadcrumbs (без Redux/Context).
- React-Bootstrap для верстки.
- Fetch на чистом `fetch` с fallback на mock (`src/services/api.ts`).
- Проксирование `/api` → `http://localhost:3000/api` настроено в `vite.config.ts`.

## Демонстрация
1) Mock (бэк не запущен): открыть `/beams` — видны карточки из `src/data/mockBeams.ts`, желтый бедж “Mock”.
2) С бэкендом: поднять Rails через `docker-compose up`, снова `/beams` — зеленый бедж “API”, в Network видно запрос на `/api/beams` (прокси). Изображения с MinIO берутся напрямую по `http://localhost:9000/...`.
3) Изменение БД: добавить/править балку (API `POST /api/beams` или seed/console), обновить страницу — новая запись отображается в списке/деталях.

## Где править
- `src/services/api.ts` — fetch + прокси + mock.
- `src/data/mockBeams.ts` — мок-данные и примеры MinIO URL.
- `src/pages/*` — страницы.
- `src/components/*` — navbar, breadcrumbs, карточка, фильтры.
