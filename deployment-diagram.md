# Диаграмма развертывания (Deployment Diagram)

Источники для диаграммы: `docker-compose.yml`, `nginx/nginx.conf`, `swagger/v1/swagger.yaml`, `.env`.

## Docker Compose (локально / один сервер)

```mermaid
flowchart TB
  subgraph C["Клиент"]
    browser["Браузер / PWA"]
    tauri["Tauri desktop app"]
  end

  subgraph H["Хост (localhost)"]
    subgraph D["Docker Compose (Docker)"]
      https_srv["HTTPS-сервер<br/>(reverse proxy + статика)<br/>:443 (host 8080)"]
      vite["Frontend: Node 20 + Vite<br/>React SPA (dev)<br/>:5173 (HTTPS)"]
      rails["Web-сервис: Ruby on Rails 8<br/>REST API + web pages<br/>:3000 (HTTPS) (host 3000)"]

      pg[("PostgreSQL 15<br/>:5432")]
      redis[("Redis 7<br/>:6379")]
      minio[("MinIO (S3)<br/>API :9000<br/>Console :9001")]
    end
  end

  browser -->|HTTPS 8080<br/>UI + REST JSON API (/api)| https_srv
  tauri -->|HTTPS 8080<br/>REST JSON API (/api)| https_srv

  https_srv -->|proxy / (HTTPS 5173)<br/>HMR WebSocket| vite
  https_srv -->|proxy /api/*, /api-docs, /api-json, /cart<br/>HTTPS 3000| rails

  rails -->|TCP 5432| pg
  rails -->|TCP 6379<br/>JWT blacklist| redis
  rails -->|HTTP 9000<br/>S3 API (upload/presign)| minio

  browser -.->|HTTP 9000<br/>beam images (public)| minio
  browser -.->|HTTP 9001<br/>MinIO Console (опционально)| minio
```

## Точки входа (по умолчанию)

- Вход в приложение (HTTPS-сервер): `https://localhost:8080`
- Backend (Rails, порт 3000): `https://localhost:3000`
- API: `/api/*` (JWT), Swagger UI: `/api-docs`, OpenAPI JSON: `/api-json`
- PostgreSQL: `localhost:5432`, Redis: `localhost:6379`
- MinIO: `http://localhost:9000` (S3), `http://localhost:9001` (console)
