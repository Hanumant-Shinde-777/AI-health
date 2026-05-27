// Groq API Service (Fallback AI Engine)
// Only called when dataset engine finds no match
// Uses llama3-70b-8192 model via Groq API

import Groq from 'groq-sdk'

let groqClient = null

const getClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

const SYSTEM_PROMPT = `You are a medical AI assistant. Analyze symptoms and return ONLY a valid JSON object.
No extra text, no markdown, no explanation — just the JSON.`

const ANALYZE_PROMPT = (symptoms) => `
Analyze these patient symptoms: "${symptoms}"

Return ONLY this JSON structure (no extra text).
Do NOT include follow-up questions — they are generated separately one at a time.
{
  "detectedSymptom": "main symptom name",
  "bodySystem": "affected body system (e.g. Respiratory, Cardiovascular, Digestive, Neurological, General)",
  "disease": "most likely condition",
  "specialization": "recommended doctor specialization",
  "riskLevel": "Low | Medium | High",
  "confidence": 70,
  "advice": "brief self-care advice"
}
`

const FINAL_ANALYSIS_PROMPT = (symptoms, answers, additionalNotes) => `
Patient symptoms: "${symptoms}"
Patient answers: ${JSON.stringify(answers)}
Additional notes: "${additionalNotes || 'None'}"

Based on all information, return ONLY this JSON:
{
  "disease": "most likely diagnosis",
  "confidence": 75,
  "specialization": "recommended doctor specialization",
  "riskLevel": "Low | Medium | High",
  "advice": "medical advice and next steps"
}
`

const MIN_DIAGNOSTIC_QUESTIONS = 7
const MAX_DIAGNOSTIC_QUESTIONS = 15

const NEXT_QUESTION_SYSTEM_PROMPT = `You are a clinical symptom analysis engine powered by Groq.
Dynamically generate between 7 and 15 diagnostic questions one at a time, then indicate done when complete.

QUESTION RULES:
1. Minimum 7, maximum 15 questions — never less, never more
2. Every question dynamically generated from symptoms and all previous answers — no hardcoded or template questions
3. Each question must build on previous answers to go deeper
4. Never repeat a question already asked
5. Return done: true only after minimum 7 questions AND enough clinical clarity is reached
6. Return done: false with next question if under 15 and more clarity needed

ACCURACY RULES:
1. Options must be specific to the question — never generic Yes/No unless clinically appropriate
2. Never ask about symptoms not related to the input
3. Injury symptoms must never trigger fever or infection questions unless mentioned
4. Each question must narrow down the diagnosis further than the previous one

Output ONLY valid JSON. No markdown, no extra text.`

const NEXT_QUESTION_PROMPT = (symptoms, history, additionalNotes) => {
  const answeredCount = history.length
  const nextQuestionNumber = answeredCount + 1
  const mustContinue = answeredCount < MIN_DIAGNOSTIC_QUESTIONS
  const atMaximum = answeredCount >= MAX_DIAGNOSTIC_QUESTIONS

  return `
Symptoms (raw): ${JSON.stringify(symptoms)}
Additional notes (may be empty): ${JSON.stringify(additionalNotes || '')}

Session history (${answeredCount} questions answered so far):
${JSON.stringify(history)}

Session status:
- Questions answered: ${answeredCount}
- Next question number: ${nextQuestionNumber} (must be between 1 and ${MAX_DIAGNOSTIC_QUESTIONS})
- Minimum required before done: ${MIN_DIAGNOSTIC_QUESTIONS}
- Maximum allowed: ${MAX_DIAGNOSTIC_QUESTIONS}
- ${mustContinue ? `MUST ask at least ${MIN_DIAGNOSTIC_QUESTIONS - answeredCount} more question(s) before done:true is allowed.` : 'Minimum question count reached; done:true is allowed if clinical clarity is sufficient.'}
- ${atMaximum ? 'Maximum reached — you must return done:true.' : `You may ask up to ${MAX_DIAGNOSTIC_QUESTIONS - answeredCount} more question(s).`}

Return ONLY one of these JSON shapes (strict JSON, no markdown):

If under ${MIN_DIAGNOSTIC_QUESTIONS} answered: you MUST return done:false with the next question.

If ${MIN_DIAGNOSTIC_QUESTIONS}–${MAX_DIAGNOSTIC_QUESTIONS - 1} answered and more clarity needed:
{
  "done": false,
  "question": {
    "question": "<dynamically generated question text>",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  },
  "rationale": "<one line: why this question is being asked>"
}

If at least ${MIN_DIAGNOSTIC_QUESTIONS} answered AND enough clinical clarity (or at ${MAX_DIAGNOSTIC_QUESTIONS} questions):
{
  "done": true,
  "rationale": "<one line: why enough information has been collected>"
}

Constraints:
- Provide exactly 3–6 options per question; each option must be specific to this case.
- Do not ask for multiple things in one question.
- Do not output more than one question.
- Never repeat a question from session history.`
}

/**
 * Parses the AI response, extracting JSON from any wrapper text.
 * @param {string} content
 * @returns {object}
 */
const parseJson = (content) => {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}

const DEFAULT_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]

const resolveModelCandidates = () => {
  const envModel = (process.env.GROQ_MODEL ?? '').trim()
  if (!envModel) return DEFAULT_GROQ_MODELS
  return [envModel, ...DEFAULT_GROQ_MODELS.filter((m) => m !== envModel)]
}

const createCompletionWithFallback = async (params) => {
  const client = getClient()
  if (!client) throw new Error('GROQ_API_KEY not configured')

  const models = resolveModelCandidates()
  let lastError = null

  for (const model of models) {
    try {
      return await client.chat.completions.create({
        ...params,
        model,
      })
    } catch (err) {
      lastError = err
      const message = String(err?.message ?? '')
      const isModelIssue =
        message.includes('model_decommissioned') ||
        message.includes('model_not_found') ||
        message.includes('no longer supported')
      if (!isModelIssue) {
        throw err
      }
    }
  }

  throw lastError ?? new Error('Groq completion failed')
}

/**
 * Analyzes symptoms using Groq LLaMA 3 and returns structured response.
 * @param {string} symptoms
 * @returns {Promise<object>}
 */
export const analyzeWithGroq = async (symptoms) => {
  const completion = await createCompletionWithFallback({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: ANALYZE_PROMPT(symptoms) },
    ],
    temperature: 0.3,
    max_tokens: 800,
  })

  const content = completion.choices[0]?.message?.content ?? ''
  const parsed = parseJson(content)

  return {
    detectedSymptom: parsed.detectedSymptom ?? symptoms.slice(0, 50),
    bodySystem: parsed.bodySystem ?? 'General',
    disease: parsed.disease ?? 'Unknown',
    specialization: parsed.specialization ?? 'General Physician',
    riskLevel: parsed.riskLevel ?? 'Low',
    confidence: Number(parsed.confidence) || 65,
    questions: [],
    advice: parsed.advice ?? 'Consult a doctor.',
  }
}

/**
 * Runs final diagnosis after collecting all patient answers.
 * @param {string} symptoms
 * @param {object} answers
 * @param {string} additionalNotes
 * @returns {Promise<object>}
 */
export const finalAnalysisWithGroq = async (symptoms, answers, additionalNotes) => {
  const completion = await createCompletionWithFallback({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: FINAL_ANALYSIS_PROMPT(symptoms, answers, additionalNotes) },
    ],
    temperature: 0.3,
    max_tokens: 400,
  })

  const content = completion.choices[0]?.message?.content ?? ''
  const parsed = parseJson(content)

  return {
    disease: parsed.disease ?? 'Unknown',
    confidence: Number(parsed.confidence) || 65,
    specialization: parsed.specialization ?? 'General Physician',
    riskLevel: parsed.riskLevel ?? 'Low',
    advice: parsed.advice ?? 'Consult a doctor.',
  }
}

/**
 * Generates the next follow-up question (one at a time), based on symptoms + full history.
 * @param {string} symptoms
 * @param {Array<{question: string, answer: string}>} history
 * @param {string} additionalNotes
 * @returns {Promise<{done: boolean, question?: {question: string, options: string[]}, rationale?: string}>}
 */
const normalizeQuestionKey = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim()

export const nextQuestionWithGroq = async (symptoms, history = [], additionalNotes = '') => {
  const safeHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item.question === 'string' && typeof item.answer === 'string')
        .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
        .filter((item) => item.question && item.answer)
    : []

  const answeredCount = safeHistory.length

  if (answeredCount >= MAX_DIAGNOSTIC_QUESTIONS) {
    return {
      done: true,
      rationale: `Maximum ${MAX_DIAGNOSTIC_QUESTIONS} diagnostic questions collected.`,
    }
  }

  const asked = new Set(safeHistory.map((h) => normalizeQuestionKey(h.question)))
  const maxAttempts = 4

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const mustForceQuestion = answeredCount < MIN_DIAGNOSTIC_QUESTIONS
    const retryNote =
      attempt === 0
        ? ''
        : mustForceQuestion
          ? `\n\nYou returned done:true too early or an invalid/repeated question. You MUST return done:false with question #${answeredCount + 1} (minimum ${MIN_DIAGNOSTIC_QUESTIONS} required).`
          : '\n\nYour previous output repeated an earlier question or was invalid. Generate a DIFFERENT question that has not been asked.'

    const completion = await createCompletionWithFallback({
      messages: [
        { role: 'system', content: NEXT_QUESTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: NEXT_QUESTION_PROMPT(symptoms, safeHistory, additionalNotes) + retryNote,
        },
      ],
      temperature: 0.45 + attempt * 0.08,
      max_tokens: 500,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const parsed = parseJson(content)

    if (parsed?.done === true) {
      if (answeredCount < MIN_DIAGNOSTIC_QUESTIONS) {
        continue
      }
      return { done: true, rationale: String(parsed.rationale ?? '').slice(0, 240) }
    }

    const q = parsed?.question?.question
    const opts = parsed?.question?.options
    const question = typeof q === 'string' ? q.trim() : ''
    const options = Array.isArray(opts) ? opts.map((o) => String(o).trim()).filter(Boolean).slice(0, 6) : []

    if (!question || options.length < 2) {
      continue
    }

    if (asked.has(normalizeQuestionKey(question))) {
      continue
    }

    return { done: false, question: { question, options }, rationale: String(parsed.rationale ?? '').slice(0, 240) }
  }

  throw new Error('Unable to generate a valid next question after multiple attempts')
}

export { MIN_DIAGNOSTIC_QUESTIONS, MAX_DIAGNOSTIC_QUESTIONS }
