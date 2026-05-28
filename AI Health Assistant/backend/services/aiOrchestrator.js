// AI Orchestrator Service
// Coordinates the three-layer AI pipeline:
//   1. Emergency Detection (highest priority — instant return)
//   2. Dataset Engine (primary — free, fast, no API call)
//   3. Groq API (fallback — only when dataset has no match)

import { detectEmergency } from './emergencyService.js'
import { findSymptomMatch } from './datasetService.js'
import { analyzeWithGroq, finalAnalysisWithGroq, nextQuestionWithGroq } from './groqService.js'

const DATASET_MAX_QUESTIONS = 7
const DATASET_EARLY_STOP_CONFIDENCE = 88

/**
 * Normalizes riskLevel strings to a consistent format.
 * Dataset uses "Low"/"Medium"/"High"/"Critical"; frontend uses "LOW"/"MEDIUM"/"HIGH"
 * @param {string} level
 * @returns {string}
 */
const normalizeRisk = (level) => {
  if (!level) return 'LOW'
  const map = {
    low: 'LOW', medium: 'MEDIUM', high: 'HIGH', critical: 'HIGH',
    Critical: 'HIGH', Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH',
  }
  return map[level] ?? level.toUpperCase()
}

/**
 * Step 1: Analyze symptoms — runs emergency check → dataset → Groq fallback.
 * Called from /api/ai/analyze-symptoms
 * @param {string} symptoms - Raw symptom text from patient
 * @returns {Promise<object>} Structured AI response
 */
export const analyzeSymptoms = async (symptoms) => {
  if (!symptoms?.trim()) {
    return {
      isEmergency: false,
      detectedSymptom: '',
      bodySystem: 'General',
      disease: '',
      specialization: 'General Physician',
      riskLevel: 'LOW',
      confidence: 0,
      questions: [],
      advice: '',
      source: 'none',
    }
  }

  // ── Layer 1: Emergency Detection ──────────────────────────────────────────
  const emergency = detectEmergency(symptoms)
  if (emergency.isEmergency) {
    return {
      ...emergency,
      riskLevel: normalizeRisk(emergency.riskLevel),
      source: 'emergency',
    }
  }

  // ── Layer 2: Dataset Engine ───────────────────────────────────────────────
  const datasetResult = findSymptomMatch(symptoms)
  if (datasetResult.found) {
    const datasetQuestions = Array.isArray(datasetResult.questions)
      ? datasetResult.questions
          .filter((item) => item && typeof item.question === 'string' && Array.isArray(item.options))
          .map((item) => ({
            question: item.question.trim(),
            options: item.options.map((opt) => String(opt).trim()).filter(Boolean),
          }))
          .filter((item) => item.question && item.options.length >= 2)
          .slice(0, DATASET_MAX_QUESTIONS)
      : []
    return {
      isEmergency: false,
      detectedSymptom: datasetResult.detectedSymptom,
      bodySystem: datasetResult.bodySystem,
      disease: datasetResult.disease,
      specialization: datasetResult.specialization,
      riskLevel: normalizeRisk(datasetResult.riskLevel),
      confidence: datasetResult.confidence,
      questions: datasetQuestions,
      advice: datasetResult.advice,
      source: 'dataset',
    }
  }

  // ── Layer 3: Groq API Fallback ────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const groqResult = await analyzeWithGroq(symptoms)
      return {
        isEmergency: false,
        ...groqResult,
        questions: [],
        riskLevel: normalizeRisk(groqResult.riskLevel),
        source: 'groq',
      }
    } catch (err) {
      console.error('[AIOrchestrator] Groq fallback failed:', err.message)
    }
  }

  // ── No match found anywhere ───────────────────────────────────────────────
  return {
    isEmergency: false,
    detectedSymptom: symptoms.slice(0, 50),
    bodySystem: 'General',
    disease: '',
    specialization: 'General Physician',
    riskLevel: 'LOW',
    confidence: 0,
    questions: [],
    advice: 'Please consult a doctor for proper evaluation.',
    source: 'none',
  }
}

/**
 * Step 1b: Generate the next follow-up question (one at a time).
 * Requirements:
 * - 7–15 diagnostic questions (enforced server-side)
 * - No hardcoded/template questions
 * - Must be generated only from symptoms + prior Q/A
 * - Must not repeat earlier questions
 * - done:true only after ≥7 answers and sufficient clinical clarity (or at 15 max)
 *
 * @param {string} symptoms
 * @param {Array<{question: string, answer: string}>} history
 * @param {string} additionalNotes
 * @returns {Promise<{done: boolean, question?: {question: string, options: string[]}, rationale?: string}>}
 */
export const nextFollowUpQuestion = async (symptoms, history = [], additionalNotes = '') => {
  const emergency = detectEmergency(symptoms)
  if (emergency.isEmergency) {
    return {
      done: true,
      rationale: 'Emergency detected; stop follow-up questions.',
      flowType: 'emergency',
      minQuestions: 0,
      maxQuestions: 0,
      confidenceReached: true,
    }
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item.question === 'string' && typeof item.answer === 'string')
        .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
        .filter((item) => item.question && item.answer)
    : []

  const datasetResult = findSymptomMatch(symptoms)
  const datasetQuestions = datasetResult?.found && Array.isArray(datasetResult.questions)
    ? datasetResult.questions
        .filter((item) => item && typeof item.question === 'string' && Array.isArray(item.options))
        .map((item) => ({
          question: item.question.trim(),
          options: item.options.map((opt) => String(opt).trim()).filter(Boolean),
        }))
        .filter((item) => item.question && item.options.length >= 2)
        .slice(0, DATASET_MAX_QUESTIONS)
    : []

  const canUseGroq = Boolean(process.env.GROQ_API_KEY)

  if (datasetResult?.found && datasetQuestions.length > 0) {
    const answeredCount = safeHistory.length
    const confidenceReached = Number(datasetResult.confidence) >= DATASET_EARLY_STOP_CONFIDENCE
    const datasetQuestionTarget = Math.min(DATASET_MAX_QUESTIONS, datasetQuestions.length)

    // Dataset-first flow: if confidence is already high and we collected at least one answer, stop early.
    if (confidenceReached && answeredCount >= 1) {
      return {
        done: true,
        rationale: `Dataset confidence threshold reached (${datasetResult.confidence}%).`,
        flowType: 'dataset',
        minQuestions: 1,
        maxQuestions: datasetQuestionTarget,
        confidenceReached: true,
      }
    }

    // Keep asking dataset questions first (1..7, limited by dataset availability).
    if (answeredCount < datasetQuestionTarget) {
      return {
        done: false,
        question: datasetQuestions[answeredCount],
        rationale: 'Dataset-first question flow active.',
        flowType: 'dataset',
        minQuestions: 1,
        maxQuestions: datasetQuestionTarget,
        confidenceReached: false,
      }
    }

    // Still unclear after dataset phase -> continue with Groq interview (7..15),
    // carrying full dataset Q/A history as context.
    if (!canUseGroq) {
      return {
        done: true,
        rationale: `Completed ${datasetQuestionTarget} dataset follow-up questions.`,
        flowType: 'dataset',
        minQuestions: 1,
        maxQuestions: datasetQuestionTarget,
        confidenceReached: false,
      }
    }

    const groqAfterDataset = await nextQuestionWithGroq(symptoms, safeHistory, additionalNotes)
    return {
      ...groqAfterDataset,
      flowType: 'groq',
      minQuestions: 7,
      maxQuestions: 15,
      confidenceReached: Boolean(groqAfterDataset.done),
    }
  }

  if (!canUseGroq) {
    throw new Error('Dynamic follow-up questioning requires GROQ_API_KEY configuration.')
  }

  const groqResult = await nextQuestionWithGroq(symptoms, safeHistory, additionalNotes)
  return {
    ...groqResult,
    flowType: 'groq',
    minQuestions: 7,
    maxQuestions: 15,
    confidenceReached: Boolean(groqResult.done),
  }
}

/**
 * Step 2: Final analysis — runs after all patient answers are collected.
 * Called from /api/ai/final-analysis
 * Uses Groq for richer diagnosis, falls back to dataset result if Groq unavailable.
 * @param {string} symptoms
 * @param {object} answers - Patient's answers to follow-up questions
 * @param {string} additionalNotes
 * @returns {Promise<object>}
 */
export const finalAnalysis = async (symptoms, answers, additionalNotes) => {
  // Try Groq first for final analysis (more context → better result)
  if (process.env.GROQ_API_KEY) {
    try {
      const result = await finalAnalysisWithGroq(symptoms, answers, additionalNotes)
      return {
        ...result,
        riskLevel: normalizeRisk(result.riskLevel),
        source: 'groq',
      }
    } catch (err) {
      console.error('[AIOrchestrator] Final analysis Groq failed:', err.message)
    }
  }

  // Fall back to dataset engine
  const datasetResult = findSymptomMatch(symptoms)
  if (datasetResult.found) {
    return {
      disease: datasetResult.disease,
      confidence: datasetResult.confidence,
      specialization: datasetResult.specialization,
      riskLevel: normalizeRisk(datasetResult.riskLevel),
      advice: datasetResult.advice,
      source: 'dataset',
    }
  }

  return {
    disease: 'Could not determine',
    confidence: 0,
    specialization: 'General Physician',
    riskLevel: 'LOW',
    advice: 'Please consult a General Physician for evaluation.',
    source: 'none',
  }
}
