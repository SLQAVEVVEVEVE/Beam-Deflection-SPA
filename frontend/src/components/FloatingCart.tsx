import { Link } from 'react-router-dom'

interface Props {
  to: string
  count: number
  disabled?: boolean
}

export function FloatingCart({ to, count, disabled }: Props) {
  const cartIconUrl = `${import.meta.env.BASE_URL}cart.png`

  if (disabled) {
    return (
      <button
        type="button"
        className="fab-cart is-disabled"
        title="Корзина доступна только авторизованным пользователям"
        disabled
        aria-disabled="true"
      >
        <img src={cartIconUrl} alt="" className="fab-cart__icon" style={{ opacity: 0.4 }} />
        <span className="fab-cart__badge">{count}</span>
        <span className="sr-only">Корзина недоступна</span>
      </button>
    )
  }

  return (
    <Link className="fab-cart" to={to} title="Открыть заявку" aria-label="Открыть заявку">
      <img src={cartIconUrl} alt="" className="fab-cart__icon" />
      <span className="fab-cart__badge">{count}</span>
      <span className="sr-only">В заявке: {count}</span>
    </Link>
  )
}
