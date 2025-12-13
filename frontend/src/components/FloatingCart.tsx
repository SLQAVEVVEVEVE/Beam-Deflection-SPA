interface Props {
  href: string
  count: number
  disabled?: boolean
}

export function FloatingCart({ href, count, disabled }: Props) {
  if (disabled) {
    return (
      <button
        type="button"
        className="fab-cart is-disabled"
        title="Корзина доступна только авторизованным пользователям"
        disabled
        aria-disabled="true"
      >
        <img src="/cart.png" alt="" className="fab-cart__icon" style={{ opacity: 0.4 }} />
        <span className="fab-cart__badge">{count}</span>
        <span className="sr-only">Корзина недоступна</span>
      </button>
    )
  }

  return (
    <a className="fab-cart" href={href} title="Открыть заявку" aria-label="Открыть заявку">
      <img src="/cart.png" alt="" className="fab-cart__icon" />
      <span className="fab-cart__badge">{count}</span>
      <span className="sr-only">В заявке: {count}</span>
    </a>
  )
}
