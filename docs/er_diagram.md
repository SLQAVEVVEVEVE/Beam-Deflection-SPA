# ER диаграмма (текущая БД Postgres)

Источник: реальная схема БД `beam_deflection_development` из контейнера `web_spa-db-1` (PostgreSQL), без `schema_migrations` и `ar_internal_metadata`.

## ER (Mermaid)

```mermaid
erDiagram
  USERS ||--o{ BEAM_DEFLECTIONS : creates
  USERS ||--o{ BEAM_DEFLECTIONS : moderates
  BEAM_DEFLECTIONS ||--o{ BEAM_DEFLECTIONS_BEAMS : has_items
  BEAMS ||--o{ BEAM_DEFLECTIONS_BEAMS : referenced_by

  USERS {
    bigint id PK
    varchar email UK
    varchar password_digest
    boolean moderator
    timestamp created_at
    timestamp updated_at
  }

  BEAMS {
    bigint id PK
    varchar name UK
    text description
    boolean active
    varchar image_url
    varchar image_key
    varchar material
    numeric elasticity_gpa
    numeric inertia_cm4
    int allowed_deflection_ratio
    timestamp created_at
    timestamp updated_at
  }

  BEAM_DEFLECTIONS {
    bigint id PK
    varchar status
    bigint creator_id FK
    bigint moderator_id FK
    timestamp formed_at
    timestamp completed_at
    numeric deflection_mm
    numeric result_deflection_mm
    boolean within_norm
    timestamp calculated_at
    text note
    timestamp created_at
    timestamp updated_at
  }

  BEAM_DEFLECTIONS_BEAMS {
    bigint id PK
    bigint beam_deflection_id FK
    bigint beam_id FK
    int quantity
    int position
    boolean primary
    boolean is_primary
    numeric length_m
    numeric udl_kn_m
    numeric deflection_mm
    timestamp created_at
    timestamp updated_at
  }
```

## Таблицы и ключи

### `users`
- PK: `id`
- UK: `email`
- Используется в `beam_deflections.creator_id` (`ON DELETE RESTRICT`)
- Используется в `beam_deflections.moderator_id` (`ON DELETE SET NULL`)

### `beams`
- PK: `id`
- UK: `name`
- FK из `beam_deflections_beams.beam_id` (`ON DELETE RESTRICT`)
- Check constraints: `material ∈ {wooden, steel, reinforced_concrete}`, `elasticity_gpa > 0`, `inertia_cm4 > 0`, `allowed_deflection_ratio > 0`

### `beam_deflections`
- PK: `id`
- FK: `creator_id -> users.id` (`ON DELETE RESTRICT`)
- FK: `moderator_id -> users.id` (`ON DELETE SET NULL`)
- Check constraint: `status ∈ {draft, formed, completed, rejected, deleted}`
- Partial unique index: **один draft на пользователя** `UNIQUE (creator_id) WHERE status='draft'`

### `beam_deflections_beams` (m-m: заявка ↔ балка)
- PK: `id`
- FK: `beam_deflection_id -> beam_deflections.id` (`ON DELETE RESTRICT`)
- FK: `beam_id -> beams.id` (`ON DELETE RESTRICT`)
- Unique: `UNIQUE (beam_deflection_id, beam_id)` (позиция балки в конкретной заявке)
- Check constraints: `quantity > 0`, `position > 0`, `length_m > 0`, `udl_kn_m >= 0`

