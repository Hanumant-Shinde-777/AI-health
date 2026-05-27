import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadPatientSessionData } from '@/services/patientsService'
import { useAppDispatch } from '@/store'

/** Ensures patient profile/medical history are loaded for the current authenticated user only. */
export const usePatientSession = (enabled = true): void => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAuth()
  const loadedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !isAuthenticated || user?.role !== 'PATIENT' || !user.id) {
      loadedUserId.current = null
      return
    }
    if (loadedUserId.current === user.id) {
      return
    }
    loadedUserId.current = user.id
    void loadPatientSessionData(dispatch).catch(() => {
      loadedUserId.current = null
    })
  }, [dispatch, enabled, isAuthenticated, user?.id, user?.role])
}
