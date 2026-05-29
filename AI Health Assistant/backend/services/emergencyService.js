// Emergency Detection Service
// Always runs BEFORE dataset engine and Groq to catch critical cases immediately

/** Primary emergency phrases (spec + clinical extensions). */
export const EMERGENCY_KEYWORDS = [
  'shortness of breath',
  'chest pain',
  'unconscious',
  'severe bleeding',
  'stroke',
  'heart attack',
  'not breathing',
  "can't breathe",
  'cannot breathe',
  'seizure',
  'severe allergic reaction',
  'chest pressure',
  'chest tightness',
  'passed out',
  'fainted',
  'unconsciousness',
  'convulsion',
  'anaphylaxis',
  'throat swelling',
  'cardiac arrest',
]

/** Maps matched keyword category → doctor specializations to show. */
const SPECIALIZATION_RULES = [
  {
    test: (kw, lower) =>
      ['chest pain', 'shortness of breath', 'heart attack', 'not breathing', "can't breathe", 'cannot breathe', 'chest pressure', 'chest tightness', 'cardiac arrest'].some(
        (p) => kw.includes(p) || lower.includes(p),
      ),
    specializations: ['Cardiologist', 'Pulmonologist', 'General Physician'],
  },
  {
    test: (kw, lower) =>
      ['seizure', 'stroke', 'convulsion', 'face drooping', 'sudden numbness'].some(
        (p) => kw.includes(p) || lower.includes(p),
      ),
    specializations: ['Neurologist', 'General Physician'],
  },
  {
    test: (kw, lower) =>
      ['severe allergic reaction', 'anaphylaxis', 'throat swelling'].some(
        (p) => kw.includes(p) || lower.includes(p),
      ),
    specializations: ['Allergist', 'General Physician', 'ENT'],
  },
  {
    test: (kw, lower) =>
      ['severe bleeding', 'uncontrolled bleeding', 'heavy bleeding', 'trauma', 'head trauma'].some(
        (p) => kw.includes(p) || lower.includes(p),
      ),
    specializations: ['General Surgeon', 'Emergency Medicine', 'General Physician'],
  },
  {
    test: (kw, lower) =>
      ['unconscious', 'passed out', 'fainted', 'unconsciousness'].some(
        (p) => kw.includes(p) || lower.includes(p),
      ),
    specializations: ['Emergency Medicine', 'General Physician', 'Neurologist'],
  },
]

const DEFAULT_SPECIALIZATIONS = ['Emergency Medicine', 'General Physician']

/**
 * @param {string} matchedKeyword
 * @param {string} symptomText
 * @returns {string[]}
 */
export const getRecommendedSpecializations = (matchedKeyword = '', symptomText = '') => {
  const kw = String(matchedKeyword).toLowerCase()
  const lower = String(symptomText).toLowerCase()
  for (const rule of SPECIALIZATION_RULES) {
    if (rule.test(kw, lower)) {
      return rule.specializations
    }
  }
  return DEFAULT_SPECIALIZATIONS
}

/**
 * Detects emergency keywords in the symptom text.
 * @param {string} symptoms - Raw symptom text from patient
 * @returns {{ isEmergency: boolean, ...details? }}
 */
export const detectEmergency = (symptoms) => {
  if (!symptoms || typeof symptoms !== 'string') {
    return { isEmergency: false }
  }

  const lower = symptoms.toLowerCase()
  const matched = EMERGENCY_KEYWORDS.find((keyword) => lower.includes(keyword))

  if (!matched) {
    return { isEmergency: false }
  }

  const recommendedSpecializations = getRecommendedSpecializations(matched, symptoms)

  return {
    isEmergency: true,
    riskLevel: 'Critical',
    matchedKeyword: matched,
    detectedSymptom: matched,
    bodySystem: 'Emergency',
    disease: 'Potential Medical Emergency',
    specialization: recommendedSpecializations[0] ?? 'Emergency Medicine',
    recommendedSpecializations,
    confidence: 95,
    questions: [],
    advice: 'EMERGENCY: Call emergency services immediately. Dial 112 or 108. Do not wait.',
    emergencyMessage: `Emergency symptom detected: "${matched}". Please call emergency services (112/108) immediately.`,
  }
}
