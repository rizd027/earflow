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
export interface RichSheetOptions {
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
}

export function buildRichWorksheet(options: RichSheetOptions): XLSX.WorkSheet {
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

  return ws
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
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

export function exportToXlsxRich(options: RichSheetOptions & { filename: string }) {
  const ws = buildRichWorksheet(options)
  const wb = XLSX.utils.book_new()
  const cleanSheetName = options.sheetName.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Sheet1'
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)
  downloadWorkbook(wb, options.filename)
}

export function exportToXlsxMultiSheetRich(filename: string, sheets: RichSheetOptions[]) {
  const wb = XLSX.utils.book_new()
  const usedSheetNames = new Set<string>()

  for (const sheet of sheets) {
    const ws = buildRichWorksheet(sheet)
    let cleanSheetName = sheet.sheetName.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Sheet'
    let counter = 1
    while (usedSheetNames.has(cleanSheetName.toLowerCase())) {
      cleanSheetName = `${cleanSheetName.slice(0, 28)}_${counter++}`
    }
    usedSheetNames.add(cleanSheetName.toLowerCase())
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)
  }

  downloadWorkbook(wb, filename)
}

/**
 * Monthly production report Excel export using the official template.
 * Fetches /templates/Template_Laporan_Bulanan.xlsx, injects data into both
 * sheets (FULL 1-15 & FULL 16-31), and downloads the result, preserving all
 * template formatting, borders, colors, and merged cells.
 *
 * Template column layout (0-indexed):
 *   A(0)=No  B(1)=NoKrywn  C(2)=Nama  D-E(3-4)=Proses(merged)  F(5)=Target
 *   G-U(6-20)=Daily production (15 days per sheet)  V(21)=Catatan
 *   [Extended] W(22)=Total Prod  X(23)=Target Bulan  Y(24)=Selisih
 */
export async function exportMonthlyWithTemplate(options: {
  filename: string
  productionLine: string    // e.g. 'LINE A'
  monthLabel: string        // e.g. 'AGUSTUS 2026'
  managerName: string       // e.g. 'Karen & Lala'
  selectedMonthYear: string // 'YYYY-MM'
  workers: {
    no: number
    workerNo: string
    workerName: string
    process: string
    target: number
    remark: string
  }[]
  workerIds: string[]
  dailyQty: Record<string, Record<number, number>>
  dailyTotals: Record<number, number>
  presentCounts: Record<number, number>
  absentCounts: Record<number, number>
  totalWorkers: number
  grandTotal: number
  daysInMonth: number
  foremanName: string
}) {
  // ── Fetch & parse template ────────────────────────────────────────────────
  const templateUrl = '/templates/Template_Laporan_Bulanan.xlsx'
  const response = await fetch(templateUrl)
  if (!response.ok) throw new Error(`Cannot fetch template: ${templateUrl}`)
  const arrayBuffer = await response.arrayBuffer()
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true, cellDates: false })

  // Convert YYYY-MM-DD to Excel date serial number
  function dateToSerial(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number)
    const base = new Date(1899, 11, 30)
    const target = new Date(y, m - 1, d)
    return Math.round((target.getTime() - base.getTime()) / 86400000)
  }

  function dayDateStr(day: number): string {
    const [y, m] = options.selectedMonthYear.split('-')
    return `${y}-${m}-${String(day).padStart(2, '0')}`
  }

  // Set cell value, preserving existing cell style from template
  function setCell(ws: XLSX.WorkSheet, r: number, c: number, value: string | number | null) {
    const addr = XLSX.utils.encode_cell({ r, c })
    const existing = ws[addr]
    if (value === null || value === undefined || value === '') {
      if (existing) ws[addr] = { ...existing, v: '', t: 's' }
      return
    }
    const t = typeof value === 'number' ? 'n' : 's'
    if (existing) {
      ws[addr] = { ...existing, v: value, t }
    } else {
      ws[addr] = { v: value, t }
    }
  }

  // Column indices
  const COL_NO = 0
  const COL_WORKER_NO = 1
  const COL_NAME = 2
  const COL_PROCESS = 3
  const COL_TARGET = 5
  const COL_DAILY_START = 6
  const COL_CATATAN = 21
  const COL_TOTAL_PROD = 22
  const COL_TARGET_BULAN = 23
  const COL_SELISIH = 24

  // Row indices (0-based)
  const ROW_HEADER_INFO = 1
  const ROW_COL_HEADERS = 2
  const ROW_DATE_ROW = 3
  const ROW_DATA_START = 4
  const ROW_TOTAL_DAILY = 127
  const ROW_HRUS_KERJA = 128
  const ROW_KRY_HADIR = 129
  const ROW_ABSEN = 130
  const ROW_STATISTISI = 131
  const ROW_TOTAL_BULAN = 132

  function fillSheet(ws: XLSX.WorkSheet, half: 1 | 2) {
    const startDay = half === 1 ? 1 : 16
    const endDay = half === 1 ? Math.min(15, options.daysInMonth) : options.daysInMonth
    const numDays = endDay - startDay + 1

    // ── Header info row (Row 2 in Excel) ─────────────────────────────
    setCell(ws, ROW_HEADER_INFO, COL_NO, `Production Line`)
    setCell(ws, ROW_HEADER_INFO, 3, options.productionLine)
    setCell(ws, ROW_HEADER_INFO, 4, dateToSerial(`${options.selectedMonthYear}-01`))
    setCell(ws, ROW_HEADER_INFO, 7, `Bulan: ${options.monthLabel}`)
    setCell(ws, ROW_HEADER_INFO, 9, `Manajer Produksi生产管理`)
    setCell(ws, ROW_HEADER_INFO, 12, options.managerName)

    // ── Extended column headers (Row 3) ──────────────────────────────
    setCell(ws, ROW_COL_HEADERS, COL_TOTAL_PROD, 'Total Prod\n总产量')
    setCell(ws, ROW_COL_HEADERS, COL_TARGET_BULAN, 'Target Bulan\n月目标')
    setCell(ws, ROW_COL_HEADERS, COL_SELISIH, 'Selisih\n差值')

    // ── Date serials row (Row 4) ──────────────────────────────────────
    for (let i = 0; i < numDays; i++) {
      const day = startDay + i
      const colIdx = COL_DAILY_START + i
      const serial = dateToSerial(dayDateStr(day))
      const addr = XLSX.utils.encode_cell({ r: ROW_DATE_ROW, c: colIdx })
      const existing = ws[addr]
      ws[addr] = existing
        ? { ...existing, v: serial, t: 'n', z: 'D/M' }
        : { v: serial, t: 'n', z: 'D/M' }
    }

    // ── Worker data rows (Row 5 onward) ──────────────────────────────
    options.workers.forEach((worker, idx) => {
      const rowIdx = ROW_DATA_START + idx
      const workerId = options.workerIds[idx]

      let workerHalfTotal = 0
      for (let i = 0; i < numDays; i++) {
        const day = startDay + i
        const qty = options.dailyQty[workerId]?.[day] ?? 0
        setCell(ws, rowIdx, COL_DAILY_START + i, qty > 0 ? qty : null)
        workerHalfTotal += qty
      }

      setCell(ws, rowIdx, COL_NO, worker.no)
      setCell(ws, rowIdx, COL_WORKER_NO, worker.workerNo)
      setCell(ws, rowIdx, COL_NAME, worker.workerName)
      setCell(ws, rowIdx, COL_PROCESS, worker.process)
      setCell(ws, rowIdx, COL_TARGET, worker.target)
      setCell(ws, rowIdx, COL_CATATAN, worker.remark || '')

      // Extended totals
      const workerFullTotal = Object.values(options.dailyQty[workerId] || {}).reduce((a, b) => a + b, 0)
      const targetBulan = worker.target * options.daysInMonth
      setCell(ws, rowIdx, COL_TOTAL_PROD, workerFullTotal)
      setCell(ws, rowIdx, COL_TARGET_BULAN, targetBulan)
      setCell(ws, rowIdx, COL_SELISIH, workerFullTotal - targetBulan)
    })

    // ── Row 128: Total produksi hari itu ─────────────────────────────
    let sheetDailyTotal = 0
    for (let i = 0; i < numDays; i++) {
      const day = startDay + i
      const dayTotal = options.dailyTotals[day] ?? 0
      setCell(ws, ROW_TOTAL_DAILY, COL_DAILY_START + i, dayTotal > 0 ? dayTotal : null)
      sheetDailyTotal += dayTotal
    }
    setCell(ws, ROW_TOTAL_DAILY, COL_TOTAL_PROD, sheetDailyTotal)

    // ── Rows 129-131: Catatan kehadiran ──────────────────────────────
    for (let i = 0; i < numDays; i++) {
      const day = startDay + i
      setCell(ws, ROW_HRUS_KERJA, COL_DAILY_START + i, options.totalWorkers)
      setCell(ws, ROW_KRY_HADIR, COL_DAILY_START + i, options.presentCounts[day] ?? 0)
      setCell(ws, ROW_ABSEN, COL_DAILY_START + i, options.absentCounts[day] ?? 0)
    }

    // ── Row 132: Statistisi ───────────────────────────────────────────
    setCell(ws, ROW_STATISTISI, COL_NO, `Statistisi 統計人員`)
    setCell(ws, ROW_STATISTISI, 3, options.foremanName)

    // ── Row 133: Total Produksi Bulan ─────────────────────────────────
    setCell(ws, ROW_TOTAL_BULAN, COL_DAILY_START, `${options.grandTotal} Pcs`)
    setCell(ws, ROW_TOTAL_BULAN, COL_TOTAL_PROD, options.grandTotal)
  }

  // Fill both sheets
  if (wb.Sheets['FULL 1-15']) fillSheet(wb.Sheets['FULL 1-15'], 1)
  if (wb.Sheets['FULL 16-31']) fillSheet(wb.Sheets['FULL 16-31'], 2)

  // ── Download ──────────────────────────────────────────────────────────────
  const safeFilename = options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true })
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
    if (document.body.contains(link)) document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }, 1000)
}
