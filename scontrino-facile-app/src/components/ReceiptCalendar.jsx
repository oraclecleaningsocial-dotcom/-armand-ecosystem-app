import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import ReceiptRow from './ReceiptRow'
import { eur, fromLocalDateKey, toLocalDateKey } from '../utils/format'
import { getDeadlinesForYear } from '../fiscalDeadlines'
import { getHolidaysForYear } from '../italianHolidays'
import { useI18n } from '../i18n'

const toKey = toLocalDateKey

function startOfWeek(d) {
  const offset = (d.getDay() + 6) % 7 // lunedì = 0
  const out = new Date(d)
  out.setDate(d.getDate() - offset)
  out.setHours(0, 0, 0, 0)
  return out
}

export default function ReceiptCalendar({ receipts, onOpen, from = 'calendar', reminders = [], onAddReminder, onDeleteReminder, scrollRef }) {
  const { t, lang } = useI18n()
  const dateLocale = lang === 'en' ? 'en-GB' : lang === 'fr' ? 'fr-FR' : 'it-IT'
  const WEEKDAYS = t('calendar.weekdays').split(',')
  const MONTHS_SHORT = t('calendar.monthsShort').split(',')
  const VIEW_MODES = [
    { id: 'month', label: t('calendar.mode.month') },
    { id: 'week', label: t('calendar.mode.week') },
    { id: 'year', label: t('calendar.mode.year') },
  ]
  const [viewMode, setViewMode] = useState('month')
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  // Se siamo nel mese corrente, mostra subito gli eventi di oggi senza dover toccare il
  // giorno: si vede solo se oggi rientra effettivamente nella griglia visualizzata.
  // Impostato con un effect dopo il primo render (non nello useState iniziale): quando
  // il pannello del giorno era già presente nel primissimo paint, su iOS lo scroll
  // restava a volte bloccato — Safari può calcolare l'altezza scrollabile prima che il
  // layout sia del tutto assestato e non ricalcolarla finché non arriva una mutazione
  // successiva. Un aggiornamento di stato dopo il mount forza quel ricalcolo.
  const [selected, setSelected] = useState(null)
  useEffect(() => { setSelected(toKey(new Date())) }, [])
  const [reminderTitle, setReminderTitle] = useState('')

  // Cambiare giorno selezionato può aggiungere di colpo un bel po' di contenuto (scontrini
  // + scadenze + promemoria + modulo), e su iOS lo scroll dello schermo a volte restava
  // bloccato subito dopo — Safari non sempre ricalcola l'altezza scrollabile dopo una
  // mutazione del DOM. Leggere una proprietà di layout forza il ricalcolo sincrono.
  useEffect(() => {
    const el = scrollRef?.current
    if (el) requestAnimationFrame(() => { void el.offsetHeight })
  }, [selected, scrollRef])

  const byDay = useMemo(() => {
    const map = new Map()
    for (const r of receipts) {
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [receipts])

  const remindersByDay = useMemo(() => {
    const map = new Map()
    for (const r of reminders) {
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [reminders])

  const fiscalByDay = useMemo(() => {
    const map = new Map()
    for (const d of getDeadlinesForYear(cursor.getFullYear())) {
      const list = map.get(d.date) || []
      list.push(d)
      map.set(d.date, list)
    }
    return map
  }, [cursor])

  const holidayByDay = useMemo(() => {
    const map = new Map()
    for (const h of getHolidaysForYear(cursor.getFullYear())) {
      const list = map.get(h.date) || []
      list.push(h)
      map.set(h.date, list)
    }
    return map
  }, [cursor])

  const monthCells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out = []
    for (let i = 0; i < startOffset; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) out.push(new Date(year, month, day))
    return out
  }, [cursor])

  const weekCells = useMemo(() => {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const yearMonths = useMemo(() => {
    const year = cursor.getFullYear()
    return Array.from({ length: 12 }, (_, m) => {
      let total = 0
      let count = 0
      for (const r of receipts) {
        const d = fromLocalDateKey(r.date)
        if (d.getFullYear() === year && d.getMonth() === m) { total += r.total; count += 1 }
      }
      return { m, total, count }
    })
  }, [receipts, cursor])

  const todayKey = toKey(new Date())
  const selectedReceipts = selected ? (byDay.get(selected) || []) : []
  const selectedReminders = selected ? (remindersByDay.get(selected) || []) : []
  const selectedFiscal = selected ? (fiscalByDay.get(selected) || []) : []
  const selectedHolidays = selected ? (holidayByDay.get(selected) || []) : []

  function changeMonth(delta) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    setSelected(null)
  }
  function changeWeek(delta) {
    setCursor((prev) => { const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d })
    setSelected(null)
  }
  function changeYear(delta) {
    setCursor((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1))
    setSelected(null)
  }

  function goPrev() {
    if (viewMode === 'month') changeMonth(-1)
    else if (viewMode === 'week') changeWeek(-1)
    else changeYear(-1)
  }
  function goNext() {
    if (viewMode === 'month') changeMonth(1)
    else if (viewMode === 'week') changeWeek(1)
    else changeYear(1)
  }

  function pickMonth(m) {
    setCursor(new Date(cursor.getFullYear(), m, 1))
    setViewMode('month')
  }

  function goToday() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setCursor(d)
    setSelected(toKey(d))
  }

  function switchMode(id) {
    setViewMode(id)
    setSelected(null)
  }

  function selectDay(key) {
    setSelected((prev) => (prev === key ? null : key))
    setReminderTitle('')
  }

  function submitReminder(e) {
    e.preventDefault()
    if (!reminderTitle.trim() || !selected) return
    onAddReminder?.({ date: selected, title: reminderTitle.trim() })
    setReminderTitle('')
  }

  let headerLabel
  if (viewMode === 'month') {
    headerLabel = cursor.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
  } else if (viewMode === 'year') {
    headerLabel = String(cursor.getFullYear())
  } else {
    const start = weekCells[0]
    const end = weekCells[6]
    headerLabel = start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(dateLocale, { month: 'long' })}`
      : `${start.getDate()} ${start.toLocaleDateString(dateLocale, { month: 'short' })} – ${end.getDate()} ${end.toLocaleDateString(dateLocale, { month: 'short' })}`
  }

  return (
    <div className="cal">
      <div className="cal-modes">
        {VIEW_MODES.map((v) => (
          <button key={v.id} className={`cal-mode ${viewMode === v.id ? 'is-active' : ''}`} onClick={() => switchMode(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="cal-nav">
        <button className="cal-arrow" onClick={goPrev} aria-label={t('calendar.previous')}><Icon name="ChevronLeft" size={17} /></button>
        <span className="cal-month">{headerLabel}</span>
        <div className="cal-nav-right">
          <button className="cal-today-btn" onClick={goToday}>{t('calendar.today')}</button>
          <button className="cal-arrow" onClick={goNext} aria-label={t('calendar.next')}><Icon name="ChevronRight" size={17} /></button>
        </div>
      </div>

      {viewMode === 'year' ? (
        <div className="cal-year-grid">
          {yearMonths.map(({ m, total, count }) => (
            <button key={m} className={`cal-year-cell ${count > 0 ? 'has-data' : ''}`} onClick={() => pickMonth(m)}>
              <span className="cal-year-month">{MONTHS_SHORT[m]}</span>
              <span className="cal-year-total">{count > 0 ? eur(total) : '—'}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="cal-weekdays">
            {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
          </div>

          <div className="cal-grid">
            {(viewMode === 'week' ? weekCells : monthCells).map((d, i) => {
              if (!d) return <span key={i} className="cal-cell empty" />
              const key = toKey(d)
              const dayReceipts = byDay.get(key)
              const dayReminders = remindersByDay.get(key)
              const dayFiscal = fiscalByDay.get(key)
              const dayHoliday = holidayByDay.get(key)
              return (
                <button
                  key={i}
                  className={`cal-cell ${key === todayKey ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''} ${dayReceipts ? 'has-data' : ''} ${dayHoliday ? 'is-holiday' : ''}`}
                  onClick={() => selectDay(key)}
                >
                  <span className="cal-daynum">{d.getDate()}</span>
                  <span className="cal-dots">
                    {dayReceipts && <span className="cal-dot" />}
                    {dayReminders && <span className="cal-dot reminder" />}
                    {dayFiscal && <span className="cal-dot fiscal" />}
                    {dayHoliday && <span className="cal-dot holiday" />}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {selected && (
        <div className="cal-day-panel">
          <p className="sect-label">
            {fromLocalDateKey(selected).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
            {selectedReceipts.length > 0 && <span className="cal-day-total"> · {eur(selectedReceipts.reduce((s, r) => s + r.total, 0))}</span>}
          </p>

          {selectedReceipts.length > 0 && (
            <div className="list">
              {selectedReceipts.map((r) => <ReceiptRow key={r.id} receipt={r} onOpen={(id) => onOpen(id, from)} />)}
            </div>
          )}

          {selectedHolidays.length > 0 && (
            <>
              <p className="sect-label reminders-label"><Icon name="PartyPopper" size={12} /> {t('calendar.holiday')}</p>
              <div className="reminder-list">
                {selectedHolidays.map((h) => (
                  <div className="reminder-row holiday" key={h.id}>
                    <span>{h.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedFiscal.length > 0 && (
            <>
              <p className="sect-label reminders-label"><Icon name="Landmark" size={12} /> {t('calendar.fiscalDeadlines')}</p>
              <div className="reminder-list">
                {selectedFiscal.map((f) => (
                  <div className="reminder-row fiscal" key={f.id}>
                    <span>{f.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="sect-label reminders-label"><Icon name="Bell" size={12} /> {t('calendar.reminders')}</p>
          {selectedReminders.length > 0 && (
            <div className="reminder-list">
              {selectedReminders.map((r) => (
                <div className="reminder-row" key={r.id}>
                  <span>{r.title}</span>
                  <button onClick={() => onDeleteReminder?.(r.id)} aria-label={t('calendar.deleteReminder')}><Icon name="X" size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <form className="reminder-add" onSubmit={submitReminder}>
            <input
              placeholder={t('calendar.addReminderPlaceholder')}
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
            />
            <button type="submit" aria-label={t('common.add')}><Icon name="Plus" size={15} /></button>
          </form>
        </div>
      )}
    </div>
  )
}
