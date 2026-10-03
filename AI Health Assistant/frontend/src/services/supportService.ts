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
