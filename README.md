# Beam Deflection Calculator 
Курс - Разработка Интернет Приложений 2025

Тема - расчет прогиба балок при заданных параметрах

## Quick start (Docker Compose)
- Copy env: `cp env.example .env` and set `SECRET_KEY_BASE` (generate with `docker-compose run --rm web bin/rails secret`).
- Run stack: `docker-compose up --build`.
- Prep DB: `docker-compose exec web bin/rails db:prepare`.
- Optional demo data and tokens: `docker-compose exec web bin/rails runner utilities/scripts/prepare_demo.rb` (creates `user@demo.com` and `moderator@demo.com`, both `password123`).
- Open web UI (HTTPS): https://localhost:8080 (self-signed); backend (Rails API, HTTPS): https://localhost:3000; API docs: /api-docs, API base: /api.

https://github.com/SLQAVEVVEVEVE/Beam-Deflection-Backend - бэкенд приложения

https://github.com/SLQAVEVVEVEVE/async_deflection_compute - асинхронный метод расчета результата
