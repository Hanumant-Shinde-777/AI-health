// Branded prescription PDF (A4) rendered with pdfkit.
// Note: pdfkit's built-in Helvetica covers Latin text only; names written in Devanagari need an
// embedded Unicode font with Indic shaping, which pdfkit does not provide.
import PDFDocument from 'pdfkit'

const BRAND = '#1A73E8'
const BRAND_DARK = '#0D47A1'
const TEXT = '#111827'
const MUTED = '#6B7280'
const LINE = '#E5E7EB'
const SOFT = '#F3F6FB'

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const clean = (value, fallback = '—') => {
  const s = value === null || value === undefined ? '' : String(value).trim()
  return s || fallback
}

/** Normalises the stored medicines JSON into display rows. */
const toMedicineRows = (medicines) =>
  (Array.isArray(medicines) ? medicines : [])
    .filter((m) => m && typeof m === 'object')
    .map((m) => [clean(m.name), clean(m.dosage), clean(m.frequency), clean(m.duration)])

/**
 * @param {object} p prescription with { id, diagnosis, medicines, advice, followUpDate, status, createdAt,
 *   patient: { fullName, age, gender }, doctor: { fullName, specialization, licenseNumber, clinicName, clinicAddress } }
 * @returns {Promise<Buffer>}
 */
export const renderPrescriptionPdf = (p) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: { Title: `Prescription ${p.id}`, Author: 'AI Health Assistant', Subject: 'Medical prescription' },
    })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const left = doc.page.margins.left
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const isDraft = String(p.status ?? '').toLowerCase() !== 'approved'

    // ── Header band ──
    doc.rect(0, 0, doc.page.width, 92).fill(BRAND)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('AI Health Assistant', left, 30)
    doc.font('Helvetica').fontSize(10).fillColor('#DCE8FD').text('Medical prescription', left, 56)
    doc.font('Helvetica-Bold').fontSize(30).fillColor('#FFFFFF').text('Rx', left, 26, { width, align: 'right' })

    // ── Doctor and patient blocks ──
    const top = 116
    const colW = (width - 16) / 2
    const doctor = p.doctor ?? {}
    const patient = p.patient ?? {}
    const block = (x, title, lines) => {
      doc.roundedRect(x, top, colW, 96, 8).fill(SOFT)
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), x + 12, top + 12, { width: colW - 24, characterSpacing: 0.8 })
      let y = top + 28
      lines.forEach(([text, bold], i) => {
        doc.fillColor(i === 0 ? TEXT : MUTED).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(i === 0 ? 12 : 9.5)
        doc.text(text, x + 12, y, { width: colW - 24, ellipsis: true, height: 14 })
        y += i === 0 ? 18 : 13
      })
    }
    block(left, 'Doctor', [
      [clean(doctor.fullName, 'Doctor'), true],
      [clean(doctor.specialization, '')],
      [doctor.licenseNumber ? `Reg. no. ${doctor.licenseNumber}` : ''],
      [[doctor.clinicName, doctor.clinicAddress].filter(Boolean).join(', ')],
    ])
    block(left + colW + 16, 'Patient', [
      [clean(patient.fullName, 'Patient'), true],
      [[patient.age ? `${patient.age} yrs` : null, patient.gender ? String(patient.gender).toLowerCase() : null].filter(Boolean).join(' · ')],
      [`Date: ${formatDate(p.createdAt)}`],
      [`Prescription ID: ${String(p.id).slice(0, 8).toUpperCase()}`],
    ])

    // ── Diagnosis ──
    let y = top + 96 + 24
    const sectionTitle = (title) => {
      doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(11).text(title, left, y)
      y = doc.y + 6
    }
    sectionTitle('Diagnosis')
    doc.fillColor(TEXT).font('Helvetica').fontSize(11).text(clean(p.diagnosis), left, y, { width })
    y = doc.y + 18

    // ── Medicines table ──
    sectionTitle('Medicines')
    const cols = [
      { label: '#', w: 24 },
      { label: 'Medicine', w: width * 0.36 },
      { label: 'Dosage', w: width * 0.18 },
      { label: 'Frequency', w: width * 0.2 },
      { label: 'Duration', w: width - 24 - width * 0.74 },
    ]
    const drawRow = (cells, rowY, { header = false, shade = false } = {}) => {
      const heights = cells.map((cell, i) =>
        doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 8.5 : 10).heightOfString(cell, { width: cols[i].w - 12 }),
      )
      const h = Math.max(...heights) + 14
      if (rowY + h > doc.page.height - doc.page.margins.bottom - 90) {
        doc.addPage()
        rowY = doc.page.margins.top
      }
      if (header) doc.rect(left, rowY, width, h).fill(BRAND)
      else if (shade) doc.rect(left, rowY, width, h).fill(SOFT)
      let x = left
      cells.forEach((cell, i) => {
        doc.fillColor(header ? '#FFFFFF' : TEXT).font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 8.5 : 10)
        doc.text(cell, x + 6, rowY + 7, { width: cols[i].w - 12 })
        x += cols[i].w
      })
      if (!header) doc.moveTo(left, rowY + h).lineTo(left + width, rowY + h).strokeColor(LINE).lineWidth(0.5).stroke()
      return rowY + h
    }
    y = drawRow(cols.map((c) => c.label.toUpperCase()), y, { header: true })
    const rows = toMedicineRows(p.medicines)
    if (rows.length === 0) {
      doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(10).text('No medicines prescribed.', left + 6, y + 8)
      y = doc.y + 8
    } else {
      rows.forEach((row, i) => {
        y = drawRow([String(i + 1), ...row], y, { shade: i % 2 === 1 })
      })
    }
    y += 18

    // ── Advice and follow-up ──
    if (p.advice && String(p.advice).trim()) {
      doc.y = y
      sectionTitle('Advice')
      doc.fillColor(TEXT).font('Helvetica').fontSize(10.5).text(String(p.advice).trim(), left, y, { width })
      y = doc.y + 16
    }
    if (p.followUpDate) {
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10.5).text(`Follow-up on: ${formatDate(p.followUpDate)}`, left, y)
      y = doc.y + 16
    }

    // ── Signature ──
    const sigY = Math.max(y + 24, doc.y + 24)
    doc.moveTo(left + width - 190, sigY).lineTo(left + width, sigY).strokeColor(MUTED).lineWidth(0.7).stroke()
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10).text(clean(doctor.fullName, 'Doctor'), left + width - 190, sigY + 6, { width: 190, align: 'center' })
    doc.fillColor(MUTED).font('Helvetica').fontSize(8.5)
      .text(isDraft ? 'Not yet approved' : 'Approved electronically', left + width - 190, doc.y + 2, { width: 190, align: 'center' })

    // ── Draft stamp ──
    if (isDraft) {
      doc.save()
      doc.rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] })
      doc.fillColor('#D93025').opacity(0.12).font('Helvetica-Bold').fontSize(88)
        .text('DRAFT', 0, doc.page.height / 2 - 50, { width: doc.page.width, align: 'center' })
      doc.restore()
      doc.opacity(1)
    }

    // ── Footer ──
    const footY = doc.page.height - doc.page.margins.bottom - 30
    doc.moveTo(left, footY).lineTo(left + width, footY).strokeColor(LINE).lineWidth(0.5).stroke()
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
      .text(
        isDraft
          ? 'DRAFT — not a valid prescription until approved by the doctor.'
          : 'Take medicines exactly as prescribed. Contact your doctor if symptoms worsen. In an emergency call 112.',
        left, footY + 8, { width, align: 'center' },
      )
      .text(`Generated ${formatDate(new Date())} · AI Health Assistant`, left, doc.y + 2, { width, align: 'center' })

    doc.end()
  })
