import { Breadcrumb } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

const LABELS: Record<string, string> = {
  '': 'Главная',
  beams: 'Балки',
}

export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const crumbs = [{ path: '/', label: LABELS[''] }]

  segments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const isId = /^\d+$/.test(segment)
    const label = isId ? `Балка #${segment}` : LABELS[segment] || segment
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