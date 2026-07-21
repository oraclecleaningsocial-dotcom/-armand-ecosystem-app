import { appState, createId } from './state.js';
import { syncEcosystem } from './dashboard.js';
import { scheduleReminder } from './notifications.js';

export function addBloodPressure(systolic, diastolic, heartRate, date, time, note) {
  if (!systolic || !diastolic) return { success: false, errors: ['Inserisci pressione sistolica e diastolica'] };
  const entry = {
    id: createId('pressure'),
    systolic: Number(systolic),
    diastolic: Number(diastolic),
    heartRate: heartRate ? Number(heartRate) : null,
    date: date || appState.currentDate,
    time: time || '',
    note: note || ''
  };
  appState.health.bloodPressure.push(entry);
  syncEcosystem('BLOOD_PRESSURE_ADDED', entry);
  return { success: true, entry };
}

export function addBodyTemperature(value, date, time, note) {
  if (!value) return { success: false, errors: ['Inserisci temperatura'] };
  const entry = { id: createId('temperature'), value: Number(value), unit: '°C', date: date || appState.currentDate, time: time || '', note: note || '' };
  appState.health.bodyTemperature.push(entry);
  syncEcosystem('BODY_TEMPERATURE_ADDED', entry);
  return { success: true, entry };
}

export function addMedication(medication) {
  if (!medication.name) return { success: false };
  const m = {
    id: createId('medication'),
    name: medication.name,
    dosage: medication.dosage || '',
    frequency: medication.frequency || '',
    time: medication.time || '',
    startDate: medication.startDate || appState.currentDate,
    endDate: medication.endDate || null,
    notes: medication.notes || '',
    reminderEnabled: Boolean(medication.reminderEnabled)
  };
  appState.health.medications.push(m);
  if (m.reminderEnabled && m.time) {
    scheduleReminder('medication', m.id, 'Promemoria farmaco', `${appState.user.name}, ricordati di prendere ${m.dosage} di ${m.name}`, m.startDate, m.time, 'Salute');
  }
  syncEcosystem('MEDICATION_ADDED', {});
  return { success: true, medication: m };
}

export function editMedication(medicationId, updatedData) {
  const m = appState.health.medications.find(x => x.id === medicationId);
  if (!m) return { success: false };
  Object.assign(m, updatedData);
  syncEcosystem('MEDICATION_UPDATED', {});
  return { success: true, medication: m };
}

export function deleteMedication(medicationId) {
  appState.health.medications = appState.health.medications.filter(m => m.id !== medicationId);
  syncEcosystem('MEDICATION_DELETED', {});
  return { success: true };
}

export function addSupplement(supplement) {
  if (!supplement.name) return { success: false };
  const s = {
    id: createId('supplement'),
    name: supplement.name,
    dosage: supplement.dosage || '',
    frequency: supplement.frequency || '',
    time: supplement.time || '',
    startDate: supplement.startDate || appState.currentDate,
    endDate: supplement.endDate || null,
    notes: supplement.notes || '',
    reminderEnabled: Boolean(supplement.reminderEnabled)
  };
  appState.health.supplements.push(s);
  if (s.reminderEnabled && s.time) {
    scheduleReminder('supplement', s.id, 'Promemoria integratore', `${appState.user.name}, ricordati di prendere ${s.dosage} di ${s.name}`, s.startDate, s.time, 'Salute');
  }
  syncEcosystem('SUPPLEMENT_ADDED', {});
  return { success: true, supplement: s };
}

export function editSupplement(supplementId, updatedData) {
  const s = appState.health.supplements.find(x => x.id === supplementId);
  if (!s) return { success: false };
  Object.assign(s, updatedData);
  syncEcosystem('SUPPLEMENT_UPDATED', {});
  return { success: true, supplement: s };
}

export function deleteSupplement(supplementId) {
  appState.health.supplements = appState.health.supplements.filter(s => s.id !== supplementId);
  syncEcosystem('SUPPLEMENT_DELETED', {});
  return { success: true };
}

export function calculateHealthSummary() {
  const lastPressure = appState.health.bloodPressure.at(-1) || null;
  const lastTemperature = appState.health.bodyTemperature.at(-1) || null;
  appState.healthSummary = {
    lastPressure,
    lastTemperature,
    medicationsCount: appState.health.medications.length,
    supplementsCount: appState.health.supplements.length
  };
  return appState.healthSummary;
}
