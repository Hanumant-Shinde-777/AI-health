import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MedicalHistory, Patient } from '@/types'
import { logout } from '@/store/slices/authSlice'
import { writeStorage, storageKeys } from '@/utils'

interface PatientState {
  profile: Patient | null
  medicalHistory: MedicalHistory | null
}

const initialState: PatientState = {
  profile: null,
  medicalHistory: null,
}

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Patient>) => {
      state.profile = action.payload
      writeStorage(storageKeys.profile, action.payload)
    },
    setMedicalHistory: (state, action: PayloadAction<MedicalHistory>) => {
      state.medicalHistory = action.payload
      writeStorage(storageKeys.medicalHistory, action.payload)
    },
    clearPatientData: (state) => {
      state.profile = null
      state.medicalHistory = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.profile = null
      state.medicalHistory = null
    })
  },
})

export const { setProfile, setMedicalHistory, clearPatientData } = patientSlice.actions
export default patientSlice.reducer
