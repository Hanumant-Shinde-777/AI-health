export interface HealthReportData {
  title: string
  lines: string[]
  condition?: string
  conditionLabel: string
  riskLabel: string
  risk: string
  specialistLabel: string
  specialist?: string
  disclaimer: string
}

/** Plain-text version of the consultation summary for the share sheet / clipboard. */
export const buildShareText = (data: HealthReportData): string =>
  [
    data.title,
    '',
    ...data.lines.map((line) => `• ${line}`),
    '',
    data.condition ? `${data.conditionLabel}: ${data.condition}` : null,
    `${data.riskLabel}: ${data.risk}`,
    data.specialist ? `${data.specialistLabel}: ${data.specialist}` : null,
    '',
    data.disclaimer,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Web Share API when available, clipboard otherwise. A user cancelling the sheet is not an error. */
export const shareText = async (title: string, text: string): Promise<ShareOutcome> => {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Fall through to the clipboard (e.g. share blocked in an iframe)
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
