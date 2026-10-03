// AI Routes — no authentication required (symptom analysis is anonymous)
import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { analyzeSymptoms, finalAnalysis, nextFollowUpQuestion } from '../services/aiOrchestrator.js'

const router = Router()

// Input bounds — well above what the app sends (2000-char text fields), low enough to cap LLM cost
const MAX_TEXT = 4000
const MAX_HISTORY = 50
const MAX_QA_TEXT = 1000
const MAX_ANSWER_KEYS = 50

const tooLong = (value, max) => typeof value === 'string' && value.length > max

/** Returns an error message for invalid shared fields, or null when valid. */
const validateCommon = ({ symptoms, additionalNotes }) => {
  if (!symptoms || typeof symptoms !== 'string') return 'symptoms field is required'
  if (tooLong(symptoms, MAX_TEXT)) return `symptoms must be at most ${MAX_TEXT} characters`
  if (additionalNotes != null && (typeof additionalNotes !== 'string' || additionalNotes.length > MAX_TEXT)) {
    return `additionalNotes must be a string of at most ${MAX_TEXT} characters`
  }
  return null
}

/**
 * POST /api/ai/analyze-symptoms
 * Step 1: Run emergency detection → dataset engine → Groq fallback
 * Body: { symptoms: string }
 */
router.post('/analyze-symptoms', asyncHandler(async (req, res) => {
  const { symptoms } = req.body
  const error = validateCommon({ symptoms })
  if (error) {
    return res.status(400).json({ success: false, error })
  }
  const result = await analyzeSymptoms(symptoms.trim())
  res.json({ success: true, data: result })
}))

/**
 * POST /api/ai/final-analysis
 * Step 2: Run final AI diagnosis after all Q&A collected
 * Body: { symptoms: string, answers: object, additionalNotes?: string }
 */
router.post('/final-analysis', asyncHandler(async (req, res) => {
  const { symptoms, answers, additionalNotes } = req.body
  const error = validateCommon({ symptoms, additionalNotes })
  if (error) {
    return res.status(400).json({ success: false, error })
  }
  if (answers != null) {
    const entries = typeof answers === 'object' && !Array.isArray(answers) ? Object.entries(answers) : null
    const invalid =
      !entries ||
      entries.length > MAX_ANSWER_KEYS ||
      entries.some(([key, value]) => key.length > MAX_QA_TEXT || String(value ?? '').length > MAX_QA_TEXT)
    if (invalid) {
      return res.status(400).json({ success: false, error: 'answers must be an object of short question/answer pairs' })
    }
  }
  const result = await finalAnalysis(
    symptoms.trim(),
    answers ?? {},
    additionalNotes ?? '',
  )
  res.json({ success: true, data: result })
}))

/**
 * POST /api/ai/next-question
 * Dynamically generates the next follow-up question (one at a time).
 * Body:
 *  {
 *    symptoms: string,
 *    history: Array<{ question: string, answer: string }>,
 *    additionalNotes?: string
 *  }
 */
router.post('/next-question', asyncHandler(async (req, res) => {
  const { symptoms, history, additionalNotes } = req.body
  const error = validateCommon({ symptoms, additionalNotes })
  if (error) {
    return res.status(400).json({ success: false, error })
  }
  const safeHistory = Array.isArray(history) ? history : []
  if (
    safeHistory.length > MAX_HISTORY ||
    safeHistory.some((item) => tooLong(item?.question, MAX_QA_TEXT) || tooLong(item?.answer, MAX_QA_TEXT))
  ) {
    return res.status(400).json({
      success: false,
      error: `history must have at most ${MAX_HISTORY} items with question/answer up to ${MAX_QA_TEXT} characters`,
    })
  }
  const result = await nextFollowUpQuestion(symptoms.trim(), safeHistory, additionalNotes ?? '')
  res.json({ success: true, data: result })
}))

export default router
