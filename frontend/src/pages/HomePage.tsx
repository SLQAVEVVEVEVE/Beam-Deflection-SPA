import { Button } from 'react-bootstrap'
import './HomePage.css'

export function HomePage() {
  return (
    <div className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">Расчёт прогиба балок</h1>
        <p className="hero-subtitle">
          Быстрые расчёты прогиба, проверка по норме и подбор балок для проекта. Веб-приложение, API и визуализация
          для инженеров и модераторов.
        </p>
        <div className="hero-actions">
          <Button variant="light" href="/beams" className="hero-btn">
            Перейти к балкам
          </Button>
          <Button variant="outline-light" href="/api-docs" className="hero-btn ghost">
            API документация
          </Button>
        </div>
      </div>
    </div>
  )
}