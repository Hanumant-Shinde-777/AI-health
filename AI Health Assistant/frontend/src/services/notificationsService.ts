import client from '@/services/apiClient'
import i18n from '@/i18n/i18n'
import type { AppNotification, NotificationType } from '@/types/doctors'
import { getNotificationsForRole, markAllRead as markAllLocalRead, markNotificationRead as markLocalRead } from '@/utils/notifications'
import { getAuthUserFromStorage } from '@/utils/userScope'
import { readStorage, writeStorage } from '@/utils'

type Role = 'PATIENT' | 'DOCTOR'

interface ServerNotification {
  notificationId: string
  type: NotificationType
  caseId?: string
  createdAt: string
  route?: string
  params?: Record<string, string>
}

/** Read state for server notifications is per user, on this device. */
const readKey = () => `ai-health-notifications-read:${getAuthUserFromStorage()?.id ?? 'anon'}`
const readIds = (): Set<string> => new Set(readStorage<string[]>(readKey(), []))
const saveReadIds = (ids: Set<string>) => writeStorage(readKey(), [...ids].slice(-500))

const toAppNotification = (n: ServerNotification, role: Role, read: Set<string>): AppNotification => {
  const p = n.params ?? {}
  const text = (() => {
    switch (n.type) {
      case 'DOCTOR_NEW_CASE':
        return {
          title: i18n.t('notificationsServer.newCaseTitle'),
          body: p.condition
            ? i18n.t('notificationsServer.newCaseBodyCondition', { patient: p.patientName || '—', condition: p.condition })
            : i18n.t('notificationsServer.newCaseBody', { patient: p.patientName || '—' }),
        }
      case 'PATIENT_DOCTOR_MESSAGE':
        return {
          title: i18n.t('notificationsServer.doctorMessageTitle', { doctor: p.doctorName || '—' }),
          body: p.message || i18n.t('notificationsServer.doctorMessageFallback'),
        }
      case 'PATIENT_PRESCRIPTION_READY':
        return {
          title: i18n.t('notificationsServer.prescriptionReadyTitle'),
          body: i18n.t('notificationsServer.prescriptionReadyBody', { doctor: p.doctorName || '—' }),
        }
      default:
        return { title: i18n.t('notifications.title'), body: '' }
    }
  })()
  return {
    notificationId: n.notificationId,
    type: n.type,
    caseId: n.caseId,
    receiverId: getAuthUserFromStorage()?.id ?? '',
    receiverRole: role,
    title: text.title,
    body: text.body,
    isRead: read.has(n.notificationId),
    createdAt: n.createdAt,
    route: n.route,
  }
}

const fetchServerNotifications = async (role: Role): Promise<AppNotification[]> => {
  const response = await client.get<{ success: boolean; data: ServerNotification[] }>('/notifications')
  const read = readIds()
  return (response.data.data ?? []).map((n) => toAppNotification(n, role, read))
}

/**
 * Local (this device) + server (every device) notifications, newest first.
 * When both describe the same event (same type and case) the server copy wins, and it counts as
 * read if either copy was read. `serverFailed` lets the UI say the list may be incomplete.
 */
export const loadNotifications = async (role: Role): Promise<{ items: AppNotification[]; serverFailed: boolean }> => {
  const local = getNotificationsForRole(role)
  let server: AppNotification[] = []
  let serverFailed = false
  try {
    server = await fetchServerNotifications(role)
  } catch {
    serverFailed = true
  }
  // The local copy of a doctor's question is typed DOCTOR_NEED_INFO; the server's PATIENT_DOCTOR_MESSAGE
  const sameEventType = (type: NotificationType) => (type === 'DOCTOR_NEED_INFO' ? 'PATIENT_DOCTOR_MESSAGE' : type)
  const eventKey = (n: AppNotification) => (n.caseId ? `${sameEventType(n.type)}:${n.caseId}` : n.notificationId)
  const localByEvent = new Map(local.map((n) => [eventKey(n), n]))
  const merged = [
    ...server.map((n) => {
      const twin = localByEvent.get(eventKey(n))
      return twin?.isRead ? { ...n, isRead: true } : n
    }),
    ...local.filter((n) => !server.some((s) => eventKey(s) === eventKey(n))),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items: merged, serverFailed }
}

export const getCombinedUnreadCount = async (role: Role): Promise<number> =>
  (await loadNotifications(role)).items.filter((n) => !n.isRead).length

export const markNotificationRead = (notificationId: string): void => {
  markLocalRead(notificationId)
  const ids = readIds()
  ids.add(notificationId)
  saveReadIds(ids)
}

export const markAllNotificationsRead = (role: Role, items: AppNotification[]): void => {
  markAllLocalRead(role)
  const ids = readIds()
  items.forEach((n) => ids.add(n.notificationId))
  saveReadIds(ids)
}
