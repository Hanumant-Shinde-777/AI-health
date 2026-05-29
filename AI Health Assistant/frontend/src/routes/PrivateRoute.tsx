import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePatientSession } from '@/hooks/usePatientSession'
import { useAppDispatch } from '@/store'
import { logout } from '@/store/slices/authSlice'
import type { UserRole } from '@/types'
import { decodeJwtPayload, tokenRoleFromJwt } from '@/utils/jwt'
import { isDoctorOnlyPath } from '@/utils/userScope'

interface ProtectedRouteProps extends PropsWithChildren {
  /** When set, user must have this exact role (e.g. doctor-only routes). */
  role?: UserRole
  /** When true, doctors are redirected away (patient-only routes). */
  patientOnly?: boolean
}

const ProtectedRoute = ({ children, role, patientOnly }: ProtectedRouteProps) => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, token } = useAuth()
  const location = useLocation()
  const jwtRole = tokenRoleFromJwt(token)
  const jwtPayload = token && !token.startsWith('mock-token-') ? decodeJwtPayload(token) : null
  const jwtUserId = typeof jwtPayload?.id === 'string' ? jwtPayload.id : typeof jwtPayload?.sub === 'string' ? jwtPayload.sub : null
  const roleMismatch = Boolean(jwtRole && user?.role && jwtRole !== user.role)
  const idMismatch = Boolean(jwtUserId && user?.id && jwtUserId !== user.id)
  const sessionInvalid = roleMismatch || idMismatch
  const needsPatientSession = Boolean(patientOnly && jwtRole !== 'PATIENT')

  useEffect(() => {
    if (sessionInvalid || needsPatientSession) {
      dispatch(logout())
    }
  }, [dispatch, sessionInvalid, needsPatientSession])

  usePatientSession(Boolean(patientOnly && isAuthenticated && user?.role === 'PATIENT' && !sessionInvalid && !needsPatientSession))

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (sessionInvalid || needsPatientSession) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (patientOnly && user.role !== 'PATIENT') {
    return <Navigate to="/doctor-dashboard" replace />
  }

  if (user?.role === 'PATIENT' && isDoctorOnlyPath(location.pathname)) {
    return <Navigate to="/home" replace />
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'DOCTOR' ? '/doctor-dashboard' : '/home'} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
