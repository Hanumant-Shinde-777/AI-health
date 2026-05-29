import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { roleMiddleware } from '../middleware/roleMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as emergency from '../controllers/emergencyController.js'

const router = Router()

router.get('/recommended-doctors', asyncHandler(emergency.getRecommendedDoctors))

router.use(authMiddleware)

router.post('/', asyncHandler(emergency.createEmergencyAlert))
router.get('/patient/latest', asyncHandler(emergency.getPatientLatestEmergency))
router.get('/doctor/active', roleMiddleware('doctor'), asyncHandler(emergency.listDoctorActiveEmergencies))
router.get('/:id', asyncHandler(emergency.getEmergencyById))
router.patch('/:id/respond', roleMiddleware('doctor'), asyncHandler(emergency.respondToEmergency))

export default router
