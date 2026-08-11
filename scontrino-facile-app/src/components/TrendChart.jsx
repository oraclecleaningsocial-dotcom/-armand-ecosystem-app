// Curva morbida (Catmull-Rom convertita in bezier) invece di segmenti dritti tra i punti:
// con solo 6 valori mensili una spezzata a spigoli vivi sembra un grafico "povero";
// questa è la stessa tecnica usata dai grafici a linea con cui è stata condivisa
// l'ispirazione per questa schermata.
function smoothPath(points) {
  if (points.length < 2) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

// Linea con area sfumata sotto — stile "sparkline" da dashboard, non un grafico a barre.
// I dati arrivano già pronti da last6MonthsTrend(receipts) in state.js: qui c'è solo la
// geometria SVG, nessun accesso a scontrini/stato.
export default function TrendChart({ data, color = '#22D3B8', height = 90 }) {
  const width = 300
  const values = data.map((d) => d.total)
  const max = Math.max(1, ...values)
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const topPad = 10
  const bottomPad = 8
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - bottomPad - (d.total / max) * (height - topPad - bottomPad),
  }))
  const linePath = smoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  const areaPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`
  const gradId = 'trendFill'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Colore letterale invece di var(--paper): il supporto di var() dentro attributi
          di presentazione SVG è incoerente su alcune versioni meno recenti di iOS Safari,
          lo stesso motivo per cui in questo progetto si evitano trucchi CSS non a prova
          di dispositivo — qui basta il valore fisso, il tema è comunque sempre scuro. */}
      <circle cx={last.x} cy={last.y} r="4.5" fill={color} stroke="#0e0e14" strokeWidth="2" />
    </svg>
  )
}
