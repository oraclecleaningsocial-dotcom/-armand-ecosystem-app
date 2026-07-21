import { appState, createId } from './state.js';
import { syncEcosystem } from './dashboard.js';

export function addNote(note) {
  if (!note.title && !note.text) return { success: false };
  const n = {
    id: createId('note'),
    title: note.title || 'Nota',
    text: note.text || '',
    category: note.category || 'Generale',
    date: note.date || appState.currentDate,
    time: note.time || '',
    pinned: Boolean(note.pinned)
  };
  appState.notes.push(n);
  syncEcosystem('NOTE_ADDED', n);
  return { success: true, note: n };
}

export function editNote(noteId, updatedData) {
  const n = appState.notes.find(x => x.id === noteId);
  if (!n) return { success: false };
  Object.assign(n, updatedData);
  syncEcosystem('NOTE_UPDATED', {});
  return { success: true, note: n };
}

export function deleteNote(noteId) {
  appState.notes = appState.notes.filter(n => n.id !== noteId);
  syncEcosystem('NOTE_DELETED', {});
  return { success: true };
}

export function getLatestNotes(limit = 3) {
  return [...appState.notes].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, limit);
}

export function pinNote(noteId) {
  const n = appState.notes.find(x => x.id === noteId);
  if (!n) return { success: false };
  n.pinned = !n.pinned;
  syncEcosystem('NOTE_PINNED', {});
  return { success: true, note: n };
}
