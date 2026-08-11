import { useState } from 'react'
import Icon from '../components/Icon'

function compute(a, b, op) {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '×') return a * b
  if (op === '÷') return b === 0 ? NaN : a / b
  return b
}

function formatResult(n) {
  if (!isFinite(n)) return 'Errore'
  let s = Number(n.toPrecision(12)).toString()
  if (s.length > 12) s = n.toExponential(4)
  return s
}

const INITIAL = { display: '0', stored: null, op: null, overwrite: true }

export default function Calculator({ onClose }) {
  const [s, setS] = useState(INITIAL)

  function digit(d) {
    setS((prev) => {
      if (prev.overwrite) return { ...prev, display: d, overwrite: false }
      if (prev.display === '0') return { ...prev, display: d }
      if (prev.display.replace('-', '').replace('.', '').length >= 12) return prev
      return { ...prev, display: prev.display + d }
    })
  }

  function decimal() {
    setS((prev) => {
      if (prev.overwrite) return { ...prev, display: '0.', overwrite: false }
      if (prev.display.includes('.')) return prev
      return { ...prev, display: prev.display + '.' }
    })
  }

  function operator(op) {
    setS((prev) => {
      const current = parseFloat(prev.display)
      if (prev.stored != null && prev.op && !prev.overwrite) {
        const result = compute(prev.stored, current, prev.op)
        return { display: formatResult(result), stored: result, op, overwrite: true }
      }
      return { display: prev.display, stored: current, op, overwrite: true }
    })
  }

  function equals() {
    setS((prev) => {
      if (prev.op == null) return prev
      const current = parseFloat(prev.display)
      const result = compute(prev.stored, current, prev.op)
      return { display: formatResult(result), stored: null, op: null, overwrite: true }
    })
  }

  function percent() {
    setS((prev) => ({ ...prev, display: formatResult(parseFloat(prev.display) / 100), overwrite: true }))
  }

  function backspace() {
    setS((prev) => {
      if (prev.overwrite) return prev
      const next = prev.display.slice(0, -1)
      return { ...prev, display: next === '' || next === '-' ? '0' : next }
    })
  }

  function clear() {
    setS(INITIAL)
  }

  function sign() {
    setS((prev) => {
      if (prev.display === '0') return prev
      const next = prev.display.startsWith('-') ? prev.display.slice(1) : `-${prev.display}`
      return { ...prev, display: next }
    })
  }

  // Virgola invece del punto in tutti i numeri mostrati, come da convenzione italiana.
  function itFmt(str) {
    return String(str).replace('.', ',')
  }

  const KEYS = [
    ['⌫', 'C', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['+/-', '0', ',', '='],
  ]

  function press(k) {
    if (k === 'C') return clear()
    if (k === '⌫') return backspace()
    if (k === '%') return percent()
    if (k === ',') return decimal()
    if (k === '+/-') return sign()
    if (k === '=') return equals()
    if (['+', '-', '×', '÷'].includes(k)) return operator(k)
    return digit(k)
  }

  return (
    <div className="screen calc-screen">
      <div className="calc-top">
        <button className="cam-x" onClick={onClose}><Icon name="X" size={18} /></button>
      </div>
      <div className="calc-display">
        {s.op && <span className="calc-pending">{itFmt(formatResult(s.stored))} {s.op}</span>}
        <span className="calc-value">{itFmt(s.display)}</span>
      </div>
      <div className="calc-pad">
        {KEYS.map((row, i) => (
          <div className="calc-row" key={i}>
            {row.map((k) => (
              <button
                key={k}
                className={`calc-key ${['÷', '×', '-', '+', '='].includes(k) ? 'is-op' : ''} ${['⌫', 'C', '%', '+/-'].includes(k) ? 'is-fn' : ''}`}
                onClick={() => press(k)}
              >
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
