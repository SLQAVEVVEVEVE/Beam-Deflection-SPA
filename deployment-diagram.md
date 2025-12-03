# Deployment Diagram - Beam Deflection Calculator

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   Development Machine (localhost)                       │
│                                                                         │
│  ┌─────────────────┐         ┌────────────────────────────────────┐    │
│  │     Tauri       │         │            Docker                  │    │
│  │  Desktop App    │         │                                    │    │
│  │                 │         │  ┌──────────────────────────────┐  │    │
│  │   Port: 8443    │◄────────┼─►│   Rails API (web)            │  │    │
│  └─────────────────┘         │  │   Port: 3000                 │  │    │
│                               │  └──────────────┬───────────────┘  │    │
│  ┌─────────────────┐         │                 │                  │    │
│  │     Vite        │         │  ┌──────────────▼───────────────┐  │    │
│  │   Dev Server    │         │  │   PostgreSQL                 │  │    │
│  │                 │         │  │   Port: 5432                 │  │    │
│  │   Port: 5173    │◄────────┼─►└──────────────────────────────┘  │    │
│  │                 │         │                                    │    │
│  │ (Proxy /api     │         │  ┌──────────────────────────────┐  │    │
│  │  to :3000)      │         │  │   Redis                      │  │    │
│  └─────────────────┘         │  │   Port: 6379                 │  │    │
│                               │  │   (JWT blacklist)            │  │    │
│         │                     │  └──────────────────────────────┘  │    │
│         │                     │                                    │    │
│         │                     │  ┌──────────────────────────────┐  │    │
│         │                     │  │   MinIO S3                   │  │    │
│         │                     │  │   API: 9000                  │  │    │
│         │                     │  │   Console: 9001              │  │    │
│         │                     │  │   (Beam images storage)      │  │    │
│         │                     │  └──────────────────────────────┘  │    │
│         │                     └────────────────────────────────────┘    │
│         │                                                                │
│  ┌──────▼──────────┐                                                    │
│  │   PWA Manifest  │                                                    │
│  │   Service Worker│                                                    │
│  └─────────────────┘                                                    │
└───────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Client Devices                                  │
│                                                                           │
│  ┌──────────────────────┐              ┌──────────────────────────┐    │
│  │   Desktop/Laptop     │              │   Mobile Phone           │    │
│  │                      │              │                          │    │
│  │  ┌────────────────┐  │              │  ┌────────────────┐      │    │
│  │  │   Chrome       │  │              │  │   Chrome       │      │    │
│  │  │                │  │              │  │                │      │    │
│  │  │   PWA App      │  │              │  │   PWA App      │      │    │
│  │  └────────────────┘  │              │  └────────────────┘      │    │
│  └──────────┬───────────┘              └───────────┬──────────────┘    │
│             │                                      │                    │
│             └──────────────────┬───────────────────┘                    │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GitHub Pages                                     │
│                      https://mopolop.github.io                           │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │  Static Files (index.html, JS, CSS, assets)                   │      │
│  │  + PWA Service Worker                                          │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Deployment: npm run deploy (gh-pages -d dist)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Компоненты системы

### Development Environment (localhost)

1. **Tauri Desktop App** (Port: 8443)
   - Кросс-платформенное desktop приложение
   - Rust backend + React frontend
   - Прямой доступ к Rails API

2. **Vite Dev Server** (Port: 5173)
   - React development server
   - Hot Module Replacement (HMR)
   - Proxy для `/api` → `localhost:3000`
   - PWA с Service Worker

3. **Docker Services**:
   - **Rails API** (Port: 3000)
     - REST JSON API
     - JWT authentication
     - Beam deflection calculations

   - **PostgreSQL** (Port: 5432)
     - Primary database
     - Users, beams, deflections

   - **Redis** (Port: 6379)
     - JWT token blacklist
     - Session management

   - **MinIO S3** (Ports: 9000/9001)
     - Object storage для beam images
     - S3-compatible API

### Production Environment

**GitHub Pages** (https://mopolop.github.io)
- Static hosting для PWA
- Deploy через `gh-pages` package
- CDN delivery
- HTTPS by default

## Потоки данных

1. **Development Flow**:
   - Browser → Vite (:5173) → Rails API (:3000)
   - Tauri App → Rails API (:3000)
   - Rails → PostgreSQL (:5432)
   - Rails → Redis (:6379) для JWT
   - Rails → MinIO (:9000) для изображений

2. **Production Flow**:
   - Client Device → GitHub Pages (HTTPS)
   - PWA → External Rails API (если настроен production backend)

## Deployment

```bash
# Development
docker-compose up --build
npm run dev  # Vite на :5173

# Production Build & Deploy
cd frontend
npm run build      # Build в dist/
npm run deploy     # Deploy на GitHub Pages
```

## Технологии

- **Frontend**: React 19 + TypeScript + Vite + Redux Toolkit + Bootstrap
- **Backend**: Ruby on Rails 8 + PostgreSQL + Redis + MinIO
- **Desktop**: Tauri 2 (Rust)
- **DevOps**: Docker Compose
- **Deploy**: GitHub Pages + gh-pages
- **PWA**: vite-plugin-pwa (Workbox)
