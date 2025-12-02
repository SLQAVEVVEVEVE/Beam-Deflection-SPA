# Шаги демонстрации

## 1. Mock (без бэка, данные из mock)
1. Не поднимать бэкенд. Запустить фронт: `cd frontend && npm run dev` -> http://localhost:5173.
2. Открыть `/beams`:
   - В Network видно запрос к `/api/beams` (через прокси), он падает -> берутся данные из `src/data/mockBeams.ts` (mock).
   - Карточки с мок-данными; без картинок показывается плейсхолдер.
3. Открыть `/beams/1` (mock): если API недоступно, `fetchBeam` вернёт mock.
4. Открыть `/` (hero) — статическая страница.

## 2. С бэкендом (через прокси)
1. Поднять стек: `docker-compose up -d` (db, redis, minio, web). Проверить http://localhost:3000/api/beams -> JSON с ссылками на MinIO (`http://localhost:9000/beam-deflection/...`).
2. Открыть http://localhost:5173. На `/beams`:
   - В Network видно `GET /api/beams` (прокси Vite `/api` -> `http://localhost:3000`).
   - Карточки берут `image_url` из API, картинки/плейсхолдеры из MinIO. Пример: `http://localhost:9000/beam-deflection/wooden.png`.
3. Деталь `/beams/:id` (например `/beams/1`): Network -> `GET /api/beams/1`, бейдж «API через прокси».

## 3. Показ изменения данных
1. Обновить картинку балки (пример для деревянной):
   ```bash
   docker-compose exec db psql -U postgres -d beam_deflection_development \
     -c "update beams set image_url='http://localhost:9000/beam-deflection/wood.jpg' where name like '%Деревянная%';"
   ```
2. Обновить `/beams` или `/beams/:id` — увидим новую картинку (wood.jpg из MinIO).

## 4. Детали по коду и CORS
- Логика фильтрации: `frontend/src/services/api.ts`
  - `buildQuery(filters)` собирает параметры (name, material, диапазоны E/J, ratio, даты).
  - `fetchBeams` вызывает `GET /api/beams?...`, при ошибке -> `filterMock`.
  - `fetchBeam` аналогично для `/api/beams/:id`.
  - `BeamsListPage`: `useState` для filters/beams/loading/error; `useEffect(load)` на маунт; поиск в input -> `setFilters` + `load`.
  - `BeamCard`: prop `beam`, картинка через `displayImage`, onError -> плейсхолдер, показывает имя/материал/норму, кнопка «Подробнее» (гостевой режим, без «В заявку»).
  - `BeamDetailPage`: `useParams` id, `useEffect` -> `fetchBeam`, бейдж источника, данные балки.
- Прокси и CORS:
  - Прокси: `frontend/vite.config.ts` мапит `/api` -> `http://localhost:3000`, браузер видит запросы с того же origin (`http://localhost:5173/api/...`).
  - MinIO: бакет `beam-deflection` публичный; картинки по `http://localhost:9000/beam-deflection/...`. CORS настроен на GET с любого origin. В `displayImage` относительный путь дополняется `VITE_MINIO_PUBLIC` (по умолчанию тот же URL).
- Ссылки MinIO: `image_url` из API — полный публичный адрес (напр., `http://localhost:9000/beam-deflection/wooden.png`). Для отчёта можно вставить фрагмент JSON из `/api/beams` с `name` и `image_url`.

## Быстрые команды
- Фронт dev: `cd frontend && npm run dev`
- Бэкенд: `docker-compose up -d`
- Проверить API: `curl http://localhost:3000/api/beams`
- Обновить картинку балки: см. шаг 3.1

## Где и зачем используются useState/useEffect
- `BeamsListPage`:
  - `useState` хранит filters (поля поиска/фильтров), список beams, флаги loading/error. Это позволяет управлять UI в зависимости от состояния загрузки и результата запроса.
  - `useEffect(load)` выполняет первый запрос за данными при маунте страницы.
- `BeamDetailPage`:
  - `useState` хранит beam (данные детали), source (api/mock), loading и error.
  - `useEffect` с зависимостью `numericId` делает запрос `fetchBeam` при заходе на страницу детали (или смене id).
- `Navigation`, `Breadcrumbs`, `BeamCard` — без стейта/эффектов (презентационные компоненты). `BeamCard` использует только props для отображения и onError для плейсхолдера.
- Логика: `useState` — для локального состояния, влияющего на рендер; `useEffect` — для побочных эффектов (загрузка данных при маунте/смене параметров). Это работает для гостевого интерфейса, не затрагивая другие профили.