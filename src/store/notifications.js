import { appState, createId } from './state.js';
import { syncEcosystem } from './dashboard.js';

export function addNotification(notification) {
  if (!notification.title || !notification.date) return { success: false };
  const n = {
    id: createId('notification'),
    title: notification.title,
    message: notification.message || '',
    category: notification.category || 'Generale',
    date: notification.date,
    time: notification.time || '',
    repeat: notification.repeat || 'nessuna',
    status: 'attiva',
    linkedEntityType: notification.linkedEntityType || '',
    linkedEntityId: notification.linkedEntityId || null
  };
  appState.notifications.push(n);
  syncEcosystem('NOTIFICATION_ADDED', n);
  return { success: true, notification: n };
}

export function editNotification(notificationId, updatedData) {
  const n = appState.notifications.find(x => x.id === notificationId);
  if (!n) return { success: false };
  Object.assign(n, updatedData);
  syncEcosystem('NOTIFICATION_UPDATED', {});
  return { success: true, notification: n };
}

export function deleteNotification(notificationId) {
  appState.notifications = appState.notifications.filter(n => n.id !== notificationId);
  syncEcosystem('NOTIFICATION_DELETED', {});
  return { success: true };
}

export function markNotificationCompleted(notificationId) {
  const n = appState.notifications.find(x => x.id === notificationId);
  if (!n) return { success: false };
  n.status = 'completata';
  syncEcosystem('NOTIFICATION_COMPLETED', {});
  return { success: true };
}

export function getTodayNotifications() {
  return appState.notifications.filter(n => n.date === appState.currentDate && n.status === 'attiva');
}

export function scheduleReminder(entityType, entityId, title, message, date, time, category) {
  return addNotification({ title, message, category, date, time, repeat: 'nessuna', linkedEntityType: entityType, linkedEntityId: entityId });
}
