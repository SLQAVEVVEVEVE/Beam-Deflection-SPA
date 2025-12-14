import { Carousel } from "react-bootstrap"
import "./HomePage.css"

const slides = [
  {
    badge: "Проект",
    title: "Быстрый старт расчёта",
    steps: [
      "Создайте новый проект и укажите схему пролётов",
      "Добавьте нагрузки и тип балки — двутавр, швеллер или кастом",
      "Получите прогиб, момент и рекомендации по замене профиля",
    ],
    note: "Подходит для экспресс-проверок и сравнения нескольких вариантов.",
  },
  {
    badge: "API",
    title: "Интеграция в ваш пайплайн",
    steps: [
      "Сгенерируйте ключ и подключите REST API",
      "Отправляйте параметры балки прямо из CI/CD или калькулятора",
      "Получайте JSON с расчётом и подставляйте в свои отчёты",
    ],
    note: "Экономит время на повторяющихся расчётах и снижает ошибки ручного ввода.",
  },
  {
    badge: "Модерация",
    title: "Контроль и согласование",
    steps: [
      "Передайте расчёт на проверку модератору внутри сервиса",
      "Обсудите допущения, материалы и нагрузки в комментариях",
      "Зафиксируйте согласованную версию и экспортируйте PDF",
    ],
    note: "Удобно для командной работы и ведения истории изменений.",
  },
]

export function HomePage() {
  return (
    <>
      <div className="hero" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}hero-blueprint.png)` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Расчёт прогиба балок</h1>
          <p className="hero-subtitle">
            Быстрые расчёты прогиба, проверка по норме и подбор балок для проекта. Веб-приложение, API и визуализация
            для инженеров и модераторов.
          </p>
        </div>
      </div>

      <section className="home-section">
        <div className="carousel-card">
          <div className="carousel-header">
            <p className="carousel-eyebrow">Добро пожаловать</p>
            <h2 className="carousel-title">Как работает сервис</h2>
            <p className="carousel-lead">Выберите подходящий сценарий и двигайтесь по шагам.</p>
          </div>

          <Carousel className="howto-carousel" interval={6500} pause="hover">
            {slides.map((slide) => (
              <Carousel.Item key={slide.title}>
                <div className="slide-content">
                  <div className="slide-badge">{slide.badge}</div>
                  <h3 className="slide-heading">{slide.title}</h3>
                  <ol className="slide-steps">
                    {slide.steps.map((step, index) => (
                      <li key={`${slide.title}-${index}`}>
                        <span className="step-number">{index + 1}</span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="slide-note">{slide.note}</p>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      </section>
    </>
  )
}
