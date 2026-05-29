import PDFDocument from 'pdfkit'

const formatDate = (value) => {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const normalizeMedicines = (medicines) => {
  if (!Array.isArray(medicines)) return []
  return medicines.map((item) => {
    if (typeof item === 'string') {
      return { name: item, dosage: '', frequency: '', duration: '' }
    }
    return {
      name: String(item?.name ?? item?.medicine ?? '—'),
      dosage: String(item?.dosage ?? ''),
      frequency: String(item?.frequency ?? ''),
      duration: String(item?.duration ?? ''),
    }
  })
}

/**
 * Builds a prescription PDF buffer from a Prisma prescription row (with doctor + patient).
 */
export const buildPrescriptionPdfBuffer = (row) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const doctorName = row.doctor?.fullName ?? 'Doctor'
    const doctorTitle = doctorName.toLowerCase().startsWith('dr.') ? doctorName : `Dr. ${doctorName}`
    const medicines = normalizeMedicines(row.medicines)

    doc.fontSize(20).font('Helvetica-Bold').text('Prescription', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).font('Helvetica').fillColor('#555555').text('AI Health Assistant', { align: 'center' })
    doc.fillColor('#000000')
    doc.moveDown(1.5)

    doc.fontSize(11).font('Helvetica-Bold').text(doctorTitle)
    doc.font('Helvetica').fontSize(10)
    if (row.doctor?.specialization) doc.text(row.doctor.specialization)
    if (row.doctor?.licenseNumber) doc.text(`Reg. No: ${row.doctor.licenseNumber}`)
    if (row.doctor?.clinicName) doc.text(row.doctor.clinicName)
    doc.moveDown(1)

    doc.font('Helvetica-Bold').text('Patient')
    doc.font('Helvetica')
    const patientLine = [
      row.patient?.fullName ?? 'Patient',
      row.patient?.age != null ? `${row.patient.age} yrs` : null,
      row.patient?.gender ?? null,
    ]
      .filter(Boolean)
      .join(' · ')
    doc.text(patientLine)
    doc.text(`Date: ${formatDate(row.createdAt)}`)
    doc.moveDown(1)

    doc.font('Helvetica-Bold').text('Diagnosis')
    doc.font('Helvetica').text(row.diagnosis ?? '—')
    doc.moveDown(0.75)

    doc.font('Helvetica-Bold').text('Medicines')
    doc.font('Helvetica')
    if (medicines.length === 0) {
      doc.text('—')
    } else {
      medicines.forEach((med, index) => {
        const details = [med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')
        doc.text(`${index + 1}. ${med.name}${details ? ` — ${details}` : ''}`)
      })
    }
    doc.moveDown(0.75)

    if (row.advice?.trim()) {
      doc.font('Helvetica-Bold').text('Advice')
      doc.font('Helvetica').text(row.advice.trim())
      doc.moveDown(0.75)
    }

    if (row.followUpDate) {
      doc.font('Helvetica-Bold').text('Follow-up')
      doc.font('Helvetica').text(formatDate(row.followUpDate))
    }

    doc.moveDown(2)
    doc.fontSize(9).fillColor('#666666').text('This is a computer-generated prescription.', { align: 'center' })

    doc.end()
  })
