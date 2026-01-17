import { Breadcrumb } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

const LABELS: Record<string, string> = {
  '': 'Главная',
  beams: 'Балки',
  deflections: 'Заявки',
  login: 'Вход',
  register: 'Регистрация',
  profile: 'Профиль',
}

export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const crumbs = [{ path: '/', label: LABELS[''] }]

  segments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const isId = /^\d+$/.test(segment)
    let label = LABELS[segment] || segment
    if (isId) {
      const parent = segments[index - 1]
      if (parent === 'beams') {
        label = `Балка #${segment}`
      } else if (parent === 'deflections') {
        label = `Заявка #${segment}`
      } else {
        label = `#${segment}`
      }
    }
    crumbs.push({ path, label })
  })

  return (
    <Breadcrumb className="breadcrumbs-bar mb-3">
      {crumbs.map((crumb, idx) => (
        <Breadcrumb.Item key={crumb.path} linkAs={Link} linkProps={{ to: crumb.path }} active={idx === crumbs.length - 1}>
          {crumb.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  )
}
