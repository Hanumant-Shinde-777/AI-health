import type { SymptomQuestionData } from '@/types/symptomFlow'

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term))

/** Single source of truth: symptom text → one recommended specialization. */
export const getSpecFromSymptom = (symptom: string): string => {
  const text = String(symptom ?? '').toLowerCase()

  if (includesAny(text, ['headache', 'migraine'])) {
    return 'Neurologist'
  }
  if (
    includesAny(text, [
      'shortness of breath',
      "can't breathe",
      'cannot breathe',
      'breathless',
      'difficulty breathing',
      'not breathing',
    ])
  ) {
    return 'Pulmonologist'
  }
  if (includesAny(text, ['chest pain', 'heart attack', 'palpitation', 'palpitations', 'heart', 'cardiac'])) {
    return 'Cardiologist'
  }
  if (
    includesAny(text, [
      'skin rash',
      'rash',
      'allergy',
      'allergic',
      'hives',
      'itching',
      'dermat',
      'eczema',
    ])
  ) {
    return 'Dermatologist'
  }
  if (
    includesAny(text, [
      'stomach',
      'digestion',
      'nausea',
      'vomit',
      'vomiting',
      'diarrhea',
      'abdominal',
      'gastro',
      'indigestion',
    ])
  ) {
    return 'Gastroenterologist'
  }
  if (
    includesAny(text, ['joint pain', 'bone', 'fracture', 'knee', 'spine', 'orthopedic', 'joint', 'arthritis'])
  ) {
    return 'Orthopedist'
  }
  if (includesAny(text, ['eye', 'vision', 'blurry', 'ophthalm', 'eyesight'])) {
    return 'Ophthalmologist'
  }
  if (includesAny(text, ['ear', 'nose', 'throat', 'sinus', 'ent', 'nasal', 'congestion', 'tonsil'])) {
    return 'ENT Specialist'
  }
  if (includesAny(text, ['fever', 'cold', 'cough', 'flu', 'weakness', 'body pain'])) {
    return 'General Physician'
  }

  return 'General Physician'
}

/** Fallback order when the recommended specialization has no available doctors. */
export const SPECIALIZATION_FALLBACK_ORDER: Record<string, string[]> = {
  Neurologist: ['General Physician'],
  Pulmonologist: ['Cardiologist', 'General Physician'],
  Cardiologist: ['General Physician'],
  Dermatologist: ['Allergist', 'General Physician'],
  Gastroenterologist: ['General Physician'],
  Orthopedist: ['General Physician'],
  Ophthalmologist: ['General Physician'],
  'ENT Specialist': ['General Physician'],
  Allergist: ['General Physician'],
  'General Physician': [],
}

/** DB may store alternate spellings — try each alias when querying. */
export const SPECIALIZATION_QUERY_ALIASES: Record<string, string[]> = {
  Orthopedist: ['Orthopedist', 'Orthopedic', 'Orthopaedic'],
  'ENT Specialist': ['ENT Specialist', 'ENT'],
  Pulmonologist: ['Pulmonologist', 'Pulmonary'],
  Ophthalmologist: ['Ophthalmologist', 'Ophthalmology'],
  Gastroenterologist: ['Gastroenterologist', 'Gastroenterology'],
  Neurologist: ['Neurologist', 'Neurology'],
  Cardiologist: ['Cardiologist', 'Cardiology'],
  Dermatologist: ['Dermatologist', 'Dermatology'],
  Allergist: ['Allergist', 'Allergy'],
  'General Physician': ['General Physician', 'General Medicine'],
}

export const getSpecializationQueryVariants = (spec: string): string[] => {
  const aliases = SPECIALIZATION_QUERY_ALIASES[spec] ?? [spec]
  return [...new Set(aliases)]
}

export const getSpecializationFallbackChain = (recommendedSpec: string): string[] => {
  const chain = [recommendedSpec]
  const fallbacks = SPECIALIZATION_FALLBACK_ORDER[recommendedSpec] ?? ['General Physician']
  for (const fb of fallbacks) {
    if (!chain.includes(fb)) {
      chain.push(fb)
    }
  }
  return chain
}

/** @deprecated Use getSpecFromSymptom(symptom) — kept for any legacy callers. */
export const recommendSpecialization = (
  symptomsText: string,
  _symptomData?: SymptomQuestionData,
  _patientAge?: number,
): string => getSpecFromSymptom(symptomsText)

export const getSymptomTagsForDisplay = (
  symptomsText: string,
  symptomData: SymptomQuestionData,
): string[] => {
  const tags: string[] = []
  if (symptomData.hasFever === 'yes') tags.push('Fever')
  if (symptomData.hasChills === 'yes') tags.push('Chills')
  if (symptomData.temperature === 'high' || symptomData.temperature === 'very_high') {
    tags.push('High temperature')
  }
  if (includesAny(symptomsText.toLowerCase(), ['body pain', 'pain'])) tags.push('Body Pain')
  if (includesAny(symptomsText.toLowerCase(), ['headache'])) tags.push('Headache')
  return tags.length ? tags : symptomsText.split(/[.,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
}
