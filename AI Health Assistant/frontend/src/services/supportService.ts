import client from '@/services/apiClient'

export interface SupportMessagePayload {
  name: string
  email: string
  message: string
}

/** Sends a Help & Support message. Throws on failure — the form shows the error. */
export const sendSupportMessage = async (payload: SupportMessagePayload): Promise<{ id: string }> => {
  const response = await client.post<{ success: boolean; data: { id: string } }>('/support', payload)
  return response.data.data
}

// ---- Staff inbox ----------------------------------------------------------------

export type SupportMessageStatus = 'open' | 'closed'

export interface SupportMessage {
  id: string
  name: string
  email: string
  message: string
  userId: string | null
  role: 'patient' | 'doctor' | null
  status: SupportMessageStatus
  createdAt: string
}

export interface SupportInbox {
  messages: SupportMessage[]
  counts: Record<SupportMessageStatus, number>
}

/** Whether the signed-in account is support staff. Any failure means "no". */
export const getSupportStaffAccess = async (): Promise<boolean> => {
  try {
    const response = await client.get<{ success: boolean; data: { staff: boolean } }>('/support/access')
    return response.data.data.staff
  } catch {
    return false
  }
}

export const listSupportMessages = async (status: SupportMessageStatus | 'all'): Promise<SupportInbox> => {
  const response = await client.get<{ success: boolean; data: SupportMessage[]; counts: SupportInbox['counts'] }>(
    '/support/messages',
    { params: { status } },
  )
  return { messages: response.data.data, counts: response.data.counts }
}

export const setSupportMessageStatus = async (id: string, status: SupportMessageStatus): Promise<SupportMessage> => {
  const response = await client.patch<{ success: boolean; data: SupportMessage }>(`/support/messages/${id}`, { status })
  return response.data.data
}
