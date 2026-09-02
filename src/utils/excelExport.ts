import * as XLSX from 'xlsx'

/**
 * Utility to export data to genuine Microsoft Excel (.xlsx) files with auto-column width sizing.
 */
export function exportToXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  // Build array-of-arrays data
  const data = [headers, ...rows]

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Calculate column widths automatically for clean presentation
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = String(header).length
    for (let r = 0; r < rows.length; r++) {
      const val = rows[r][colIdx]
      if (val !== undefined && val !== null) {
        const len = String(val).length
        if (len > maxLen) maxLen = len
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) }
  })
  ws['!cols'] = colWidths

  // Create workbook and append sheet
  const wb = XLSX.utils.book_new()
  const cleanSheetName = sheetName.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Sheet1'
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)

  // Ensure filename has .xlsx extension
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`

  // Generate binary Excel buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  // Define explicit XLSX MIME type so mobile OS (iOS Safari/Android Chrome) keeps .xlsx extension instead of converting to .bin (octet-stream)
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const blob = new Blob([excelBuffer], { type: mimeType })

  // Trigger browser download via blob URL
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = safeFilename
  link.setAttribute('download', safeFilename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link)
    }
    URL.revokeObjectURL(downloadUrl)
  }, 1000)
}

/**
 * Rich Excel export that mirrors the UI layout exactly:
 * - Row 1: Chinese title (员工日目标报告表) — merged across all columns
 * - Row 2: Indonesian title (TABEL LAPORAN TARGET HARIAN KARYAWAN) — merged
 * - Row 3: empty separator
 * - Row 4: Tanggal & Bagian/Proses sub-header
 * - Row 5: empty separator
 * - Row 6: Bilingual column headers (Indonesian / 中文)
 * - Row 7+: data rows
 * - Footer: empty row, then Total Produksi, Jumlah Karyawan, Karyawan Hadir
 */
export function exportToXlsxRich(options: {
  filename: string
  sheetName: string
  titleZh: string        // e.g. '员工日目标报告表'
  titleId: string        // e.g. 'TABEL LAPORAN TARGET HARIAN KARYAWAN'
  dateLabel: string      // e.g. 'Tanggal'
  dateValue: string      // e.g. '2 September 2026'
  processLabel: string   // e.g. 'Bagian/Process'
  processValue: string   // e.g. 'SEMUA TIM / PROSES'
  shiftLabel?: string    // e.g. 'Shift A (07:00-15:00)'
  columnHeaders: string[]// e.g. ['NO / 序号', 'NO KRYWN / 员工编号', ...]
  rows: (string | number | null | undefined)[][]
  totalProduction: number
  totalProductionLabel: string  // e.g. 'Total Produksi Hari Ini (当天生产总量)'
  totalProductionUnit: string   // e.g. 'Pcs'
  expectedWorkersLabel: string  // e.g. 'Jumlah Karyawan (应到员工)'
  expectedWorkers: number
  presentWorkersLabel: string   // e.g. 'Karyawan Hadir (实到员工)'
  presentWorkers: number
  personUnit: string            // e.g. 'Orang'
}) {
  const numCols = options.columnHeaders.length
  const lastColIdx = numCols - 1

  // ── Build array-of-arrays ──────────────────────────────────────────────────
  const aoa: (string | number | null)[][] = []

  // Row 0: Chinese title (merged across all cols)
  const titleZhRow: (string | null)[] = Array(numCols).fill(null)
  titleZhRow[0] = options.titleZh
  aoa.push(titleZhRow)

  // Row 1: Indonesian title (merged across all cols)
  const titleIdRow: (string | null)[] = Array(numCols).fill(null)
  titleIdRow[0] = options.titleId
  aoa.push(titleIdRow)

  // Row 2: empty separator
  aoa.push(Array(numCols).fill(null))

  // Row 3: sub-header — date | process (use columns 0 and 3 to visually space)
  const subHeaderRow: (string | null)[] = Array(numCols).fill(null)
  subHeaderRow[0] = `${options.dateLabel} : ${options.dateValue}`
  const processText = options.shiftLabel
    ? `${options.processLabel} : ${options.processValue}  [${options.shiftLabel}]`
    : `${options.processLabel} : ${options.processValue}`
  subHeaderRow[Math.min(3, lastColIdx)] = processText
  aoa.push(subHeaderRow)

  // Row 4: empty separator
  aoa.push(Array(numCols).fill(null))

  // Row 5: bilingual column headers
  aoa.push([...options.columnHeaders])

  // Rows 6+: data rows
  for (const row of options.rows) {
    aoa.push([...row] as (string | number | null)[])
  }

  // Footer separator
  aoa.push(Array(numCols).fill(null))

  // Total Produksi row (merged label cols 0-3, value col 4+)
  const totalRow: (string | number | null)[] = Array(numCols).fill(null)
  totalRow[0] = `${options.totalProductionLabel} :`
  totalRow[Math.min(4, lastColIdx)] = `${options.totalProduction.toLocaleString('id-ID')} ${options.totalProductionUnit}`
  aoa.push(totalRow)

  // Expected workers row
  const expectedRow: (string | number | null)[] = Array(numCols).fill(null)
  expectedRow[0] = `${options.expectedWorkersLabel} :`
  expectedRow[Math.min(4, lastColIdx)] = `${options.expectedWorkers} ${options.personUnit}`
  aoa.push(expectedRow)

  // Present workers row
  const presentRow: (string | number | null)[] = Array(numCols).fill(null)
  presentRow[0] = `${options.presentWorkersLabel} :`
  presentRow[Math.min(4, lastColIdx)] = `${options.presentWorkers} ${options.personUnit}`
  aoa.push(presentRow)

  // ── Create worksheet from AOA ─────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // ── Merged cells ──────────────────────────────────────────────────────────
  // Row 0: Chinese title spans all columns (A1:F1)
  // Row 1: Indonesian title spans all columns (A2:F2)
  // Footer label cols: A:D merged for label text
  const merges: XLSX.Range[] = [
    // Chinese title — row 0, col 0 → lastColIdx
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } },
    // Indonesian title — row 1
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } },
    // Date sub-header — cols 0-2
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    // Process sub-header — cols 3-lastCol
    { s: { r: 3, c: 3 }, e: { r: 3, c: lastColIdx } },
    // Total produksi label — cols 0 to 3
    { s: { r: aoa.length - 3, c: 0 }, e: { r: aoa.length - 3, c: 3 } },
    // Expected workers label
    { s: { r: aoa.length - 2, c: 0 }, e: { r: aoa.length - 2, c: 3 } },
    // Present workers label
    { s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: 3 } },
  ]
  ws['!merges'] = merges

  // ── Column widths ─────────────────────────────────────────────────────────
  const dataRows = options.rows
  const colWidths = options.columnHeaders.map((header, colIdx) => {
    let maxLen = String(header).length
    for (const row of dataRows) {
      const val = row[colIdx]
      if (val !== undefined && val !== null) {
        const len = String(val).length
        if (len > maxLen) maxLen = len
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) }
  })
  ws['!cols'] = colWidths

  // ── Workbook ──────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  const cleanSheetName = options.sheetName.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Sheet1'
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)

  const safeFilename = options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const blob = new Blob([excelBuffer], { type: mimeType })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = safeFilename
  link.setAttribute('download', safeFilename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link)
    }
    URL.revokeObjectURL(downloadUrl)
  }, 1000)
}

