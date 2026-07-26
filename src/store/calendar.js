import { appState } from './state.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function escapeICS(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function nowStampUTC() {
  const d = new Date();
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate())
    + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

function localStamp(dateStr, timeStr, offsetMinutes = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0);
  dt.setMinutes(dt.getMinutes() + offsetMinutes);
  return dt.getFullYear() + pad(dt.getMonth() + 1) + pad(dt.getDate())
    + 'T' + pad(dt.getHours()) + pad(dt.getMinutes()) + '00';
}

function buildEvent({ uid, title, description, date, time, durationMinutes = 30 }) {
  if (!date || !title) return null;
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@armand-ecosystem-app`,
    `DTSTAMP:${nowStampUTC()}`,
    `DTSTART:${localStamp(date, time)}`,
    `DTEND:${localStamp(date, time, durationMinutes)}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : null,
    'END:VEVENT'
  ].filter(Boolean).join('\r\n');
}

export function buildCalendarEvents() {
  const events = [];

  appState.notifications
    .filter(n => n.status === 'attiva')
    .forEach(n => events.push(buildEvent({
      uid: n.id,
      title: n.title,
      description: n.message,
      date: n.date,
      time: n.time,
      durationMinutes: 15
    })));

  appState.workouts.forEach(w => events.push(buildEvent({
    uid: w.id,
    title: `Allenamento: ${w.name}`,
    description: w.notes,
    date: w.date,
    time: w.time,
    durationMinutes: Number(w.duration || 45)
  })));

  appState.health.medications.forEach(m => events.push(buildEvent({
    uid: m.id,
    title: `Farmaco: ${m.name}`,
    description: [m.dosage, m.frequency, m.notes].filter(Boolean).join(' · '),
    date: m.startDate,
    time: m.time,
    durationMinutes: 10
  })));

  appState.health.supplements.forEach(s => events.push(buildEvent({
    uid: s.id,
    title: `Integratore: ${s.name}`,
    description: [s.dosage, s.frequency, s.notes].filter(Boolean).join(' · '),
    date: s.startDate,
    time: s.time,
    durationMinutes: 10
  })));

  return events.filter(Boolean);
}

export function buildICS() {
  const events = buildCalendarEvents();
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Armand Ecosystem App//IT',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

export function exportCalendarICS() {
  const events = buildCalendarEvents();
  if (!events.length) return { success: false, errors: ['Nessun evento con data da esportare'] };
  return { success: true, ics: buildICS(), count: events.length };
}
