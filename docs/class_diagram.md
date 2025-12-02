# Диаграмма классов (опирается на исходную схему, без моделей и БД)

Бэкенд сгруппирован по доменам, как в вашей схеме. Модели и БД исключены; показаны контроллеры/сервисы и публичные методы. Фронтенд разделён на все страницы, у страниц показана зависимость от API.

```mermaid
classDiagram
  direction LR

  %% Backend domains (контроллеры)
  class ApiBaseController {
    +force_json()
    +authenticate_request()
    +bearer_token()
    +assign_current_user()
    +require_auth!()
    +require_moderator!()
    +render_error()
    +not_found()
  }

  class UserDomain <<domain>> {
    +GET /api/me()
    +POST /api/auth/sign_up()
    +POST /api/auth/sign_in()
    +POST /api/auth/sign_out()
    +PUT /api/me()
  }
  UserDomain --|> ApiBaseController
  UserDomain ..> JwtToken
  UserDomain ..> JwtBlacklist

  class ServicesDomain <<domain>> {
    +GET /api/beams()
    +GET /api/beams/:id()
    +POST /api/beams()
    +PUT /api/beams/:id()
    +DELETE /api/beams/:id()
    +POST /api/beams/:id/image()
    +POST /api/beams/:id/add_to_draft()
    +GET /api/beam_deflections/cart_badge()
  }
  ServicesDomain --|> ApiBaseController
  ServicesDomain ..> MinioHelper

  class DeflectionDomain <<domain>> {
    +GET /api/beam_deflections()
    +GET /api/beam_deflections/:id()
    +PUT /api/beam_deflections/:id()
    +DELETE /api/beam_deflections/:id()
    +PUT /api/beam_deflections/:id/form()
    +PUT /api/beam_deflections/:id/complete()
    +PUT /api/beam_deflections/:id/reject()
  }
  DeflectionDomain --|> ApiBaseController
  DeflectionDomain ..> BeamDeflectionStateMachine
  DeflectionDomain ..> CalcDeflection

  class DeflectionItemsDomain <<domain>> {
    +PUT /api/beam_deflections/:id/items/update_item()
    +DELETE /api/beam_deflections/:id/items/remove_item()
    +PUT /api/beam_deflection_beams/:id()
    +POST /api/beam_deflection_beams()
    +DELETE /api/beam_deflection_beams/:id()
    +POST /api/beam_deflection_beams/add_to_cart()
  }
  DeflectionItemsDomain --|> ApiBaseController

  %% Backend helpers/services
  class MinioHelper {
    +minio_image_url()
    +inline_svg_placeholder()
    +minio_upload()
    +minio_delete()
    +minio_presigned_url()
  }

  class CalcDeflection {
    +call(request, service)
  }

  class BeamDeflectionStateMachine {
    +can_transition_to?()
    +transition_to()
  }

  class JwtToken {
    +encode()
    +decode()
    +blacklist!()
    +blacklisted?()
  }
  JwtToken ..> JwtBlacklist : blacklist check

  class JwtBlacklist {
    +add()
    +blacklisted?()
    +remove()
    +count()
    +clear_all()
  }

  ApiBaseController ..> JwtToken : bearer auth

  %% Frontend
  class ApiService {
    +buildQuery()
    +fetchBeams()
    +fetchBeam()
    +displayImage()
    +materialLabel()
  }

  class AppShell {
    +Routes()
  }

  class HomePage {
    +render()
  }

  class BeamsListPage {
    +load()
    +render()
  }

  class BeamDetailPage {
    +load()
    +render()
  }

  class NotFoundPage {
    +render()
  }

  class Navigation
  class Breadcrumbs
  class BeamCard
  class FiltersBar

  AppShell ..> Navigation
  AppShell ..> Breadcrumbs
  AppShell ..> HomePage
  AppShell ..> BeamsListPage
  AppShell ..> BeamDetailPage
  AppShell ..> NotFoundPage

  BeamsListPage ..> ApiService : fetchBeams()
  BeamDetailPage ..> ApiService : fetchBeam()
  BeamCard ..> ApiService : displayImage(), materialLabel()
  BeamsListPage ..> BeamCard
  BeamsListPage ..> FiltersBar

  %% Frontend->Backend API dependency
  ApiService ..> ServicesDomain : /api/beams*
```
