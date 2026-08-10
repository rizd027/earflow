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

