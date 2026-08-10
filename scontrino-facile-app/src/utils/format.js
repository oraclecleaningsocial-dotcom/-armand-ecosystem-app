export function eur(n) {
  return (Number(n) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000)
  if (diffDays === 0) return 'oggi'
  if (diffDays === 1) return 'ieri'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} giorni fa`
  return formatDate(d)
}
