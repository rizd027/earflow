import { NO_KARYAWAN_LIST } from '@/data/noKaryawanData'

export interface ScannedRowData {
  day: number
  workHours: string
  cumHours?: number | string
  process: string
  targetQty: number
  prodQty: number
  cumProdQty?: number | string
  remark: string
}

export interface ScannedSheetResult {
  rawWorkerName?: string
  rawWorkerNo?: string
  rawMonth?: string
  rawJoinedDate?: string
  parsedMonthNumber?: number // 1..12
  matchedWorkerId?: string
  matchedWorkerName?: string
  matchedWorkerNo?: string
  rows: ScannedRowData[]
}

const DEFAULT_GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY as string) || localStorage.getItem('earflow_groq_api_key') || ''

/**
 * Resizes and compresses an image file to Base64 JPEG to optimize API payload size, vision tokens, and latency.
 * Uses 960px target resolution with high-quality downsampling to balance ultra-fast upload speed and high OCR accuracy.
 */
export async function compressImageToBase64(file: File | Blob, maxDimension = 960, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'))
        }

        // Enable high-quality image smoothing for clean text and sharp numbers
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const base64Data = canvas.toDataURL('image/jpeg', quality)
        resolve(base64Data)
      }
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk kompresi'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
    reader.readAsDataURL(file)
  })
}

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 1, jan: 1, january: 1, '01': 1, '1': 1,
  februari: 2, feb: 2, february: 2, '02': 2, '2': 2,
  maret: 3, mar: 3, march: 3, '03': 3, '3': 3,
  april: 4, apr: 4, '04': 4, '4': 4,
  mei: 5, may: 5, '05': 5, '5': 5,
  juni: 6, jun: 6, june: 6, '06': 6, '6': 6,
  juli: 7, jul: 7, july: 7, '07': 7, '7': 7,
  agustus: 8, agu: 8, agt: 8, august: 8, '08': 8, '8': 8,
  september: 9, sep: 9, sept: 9, '09': 9, '9': 9,
  oktober: 10, okt: 10, oct: 10, october: 10, '10': 10,
  november: 11, nov: 11, '11': 11,
  desember: 12, des: 12, dec: 12, december: 12, '12': 12
}

export function parseMonthString(monthStr?: string): number | undefined {
  if (!monthStr) return undefined
  const cleaned = monthStr.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  for (const [key, num] of Object.entries(INDONESIAN_MONTHS)) {
    if (cleaned.includes(key) || key === cleaned) {
      return num
    }
  }
  return undefined
}

/**
 * Fuzzy matching worker name or NIK to known workers in EarFlow database.
 */
export function findBestWorkerMatch(
  extractedName?: string,
  extractedNik?: string,
  workersList: Array<{ id: string; full_name: string; no_karyawan?: string }> = []
): { id: string; full_name: string; no_karyawan?: string } | null {
  if (!extractedName && !extractedNik) return null

  const cleanNik = (extractedNik || '').replace(/\D/g, '')

  // 1. Direct NIK Match against worker list or master NO_KARYAWAN_LIST
  if (cleanNik && cleanNik.length >= 4) {
    const matchedByNik = workersList.find(w => (w.no_karyawan || '').replace(/\D/g, '') === cleanNik)
    if (matchedByNik) return matchedByNik

    const masterRecord = NO_KARYAWAN_LIST.find(k => k.no_karyawan === cleanNik)
    if (masterRecord) {
      // Find worker with same master name
      const cleanMasterName = masterRecord.nama.toLowerCase().replace(/[^a-z]/g, '')
      const matched = workersList.find(w => w.full_name.toLowerCase().replace(/[^a-z]/g, '') === cleanMasterName)
      if (matched) return matched
    }
  }

  // 2. Name Matching
  if (extractedName) {
    const rawClean = extractedName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (rawClean.length < 2) return null

    // Exact stripped match
    let found = workersList.find(w => w.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') === rawClean)
    if (found) return found

    // Check if worker name contains all tokens of extracted name (e.g. "nazar" & "putra" in "Nazzar Putra A")
    const tokens = extractedName.toLowerCase().split(/\s+/).filter(t => t.length >= 3)
    
    // Fuzzy scoring
    let bestScore = 0
    let bestWorker: { id: string; full_name: string; no_karyawan?: string } | null = null

    for (const w of workersList) {
      const wClean = w.full_name.toLowerCase()
      let score = 0

      // Count matching tokens
      for (const token of tokens) {
        if (wClean.includes(token)) {
          score += token.length * 2
        } else {
          // Check 1-character typo tolerance (e.g. 'nazar' vs 'nazzar')
          const wTokens = wClean.split(/\s+/)
          for (const wt of wTokens) {
            if (wt.startsWith(token.slice(0, 3)) || token.startsWith(wt.slice(0, 3))) {
              score += 3
            }
          }
        }
      }

      if (score > bestScore && score >= 4) {
        bestScore = score
        bestWorker = w
      }
    }

    if (bestWorker) return bestWorker
  }

  return null
}

/**
 * Fallback parser in case AI model returns partial JSON or reasoning text.
 */
function parseFallbackFromText(text: string): {
  no_karyawan: string
  nama_karyawan: string
  bulan: string
  tgl_masuk: string
  rows: Array<{
    day: number
    work_hours: string
    cum_hours?: number
    process: string
    target_qty: number
    prod_qty: number
    cum_prod_qty?: number
    remark: string
  }>
} {
  const result = {
    no_karyawan: '',
    nama_karyawan: '',
    bulan: '',
    tgl_masuk: '',
    rows: [] as Array<any>
  }

  if (!text) return result

  // Extract Metadata
  const noMatch = text.match(/(?:No\s*(?:Krywn|Karyawan|NIK)|no_karyawan)[:=]\s*["']?([A-Za-z0-9]+)["']?/i)
  if (noMatch) result.no_karyawan = noMatch[1].trim()

  const nameMatch = text.match(/(?:Nama\s*(?:Karyawan)?|nama_karyawan)[:=]\s*["']?([A-Za-z\s]+?)["']?(?:\n|,|\r|\*|\-)/i)
  if (nameMatch) result.nama_karyawan = nameMatch[1].trim()

  const bulanMatch = text.match(/(?:Bulan|bulan)[:=]\s*["']?([A-Za-z0-9]+)["']?/i)
  if (bulanMatch) result.bulan = bulanMatch[1].trim()

  const tglMasukMatch = text.match(/(?:Tgl\.?\s*Masuk|tgl_masuk)[:=]\s*["']?([A-Za-z0-9\s\.\-\/]+?)["']?(?:\n|\r|\*|\-|,)/i)
  if (tglMasukMatch) result.tgl_masuk = tglMasukMatch[1].trim()

  const rowMap = new Map<number, any>()

  const rowRegexes = [
    /(?:Row|Day|Tgl)\s*(\d+)[:\s\-]+(?:.*?Jam Kerja\s*["']?([^"',\n]+)["']?)?(?:.*?Proses\s*["']?([^"',\n]+)["']?)?.*?Jml Prod\s*["']?(\d+)["']?/gi,
    /(?:Row|Day|Tgl)\s*(\d+)[:\s\-]+.*?prod_qty[:\s]*["']?(\d+)["']?/gi,
    /^\s*[-*]?\s*(\d+)\s*:\s*(\d+)\s*$/gm
  ]

  for (const rx of rowRegexes) {
    let match: RegExpExecArray | null
    while ((match = rx.exec(text)) !== null) {
      const day = parseInt(match[1], 10)
      if (day >= 1 && day <= 31) {
        if (!rowMap.has(day)) {
          let prodQty = 0
          let workHours = '7-14'
          let process = 'A1'

          if (match.length >= 5) {
            workHours = match[2]?.trim() || '7-14'
            process = match[3]?.trim() || 'A1'
            prodQty = parseInt(match[4], 10) || 0
          } else if (match.length >= 3) {
            prodQty = parseInt(match[2], 10) || 0
          }

          if (prodQty > 0) {
            rowMap.set(day, {
              day,
              work_hours: workHours,
              process,
              prod_qty: prodQty,
              target_qty: 0,
              remark: ''
            })
          }
        }
      }
    }
  }

  result.rows = Array.from(rowMap.values()).sort((a, b) => a.day - b.day)
  return result
}

function tryParseJson(str: string): any {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    // Attempt auto-repair for truncated or unclosed JSON
    let repaired = str.trim().replace(/,\s*([}\]])/g, '$1')
    
    // If truncated inside an array of rows, slice up to the last valid row object
    const lastCompleteObj = repaired.lastIndexOf('}')
    if (lastCompleteObj > 0 && lastCompleteObj < repaired.length - 1) {
      const sliced = repaired.substring(0, lastCompleteObj + 1)
      try {
        return JSON.parse(sliced + '\n]}')
      } catch {}
    }

    const openBrackets = (repaired.match(/\[/g) || []).length
    const closeBrackets = (repaired.match(/]/g) || []).length
    const openBraces = (repaired.match(/{/g) || []).length
    const closeBraces = (repaired.match(/}/g) || []).length

    if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets)
    if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces)

    try {
      return JSON.parse(repaired)
    } catch {
      return null
    }
  }
}

/**
 * Calls Groq Vision API to extract table data from the scanned production sheet.
 */
export async function scanProductionSheetWithGroq(
  imageBase64: string,
  apiKey?: string,
  onStatusUpdate?: (status: string) => void
): Promise<ScannedSheetResult> {
  const keyToUse = apiKey || DEFAULT_GROQ_API_KEY
  if (!keyToUse) {
    throw new Error('Groq API Key tidak ditemukan. Harap masukkan API Key pada pengaturan.')
  }

  const promptText = `
You are an expert OCR & production table extractor. Analyze this physical sheet titled "Tabel Statistik Produksi" (worker production log sheet).
Extract all metadata and filled table rows accurately.

Headers to look for:
- "No Krywn" / No Karyawan (NIK)
- "Nama" / Nama Karyawan
- "Bulan" (e.g. Agustus, September, etc.)
- "Tgl. Masuk" (e.g. 17-07-26, 22 Juli 2021)

Table Columns:
- Tgl (Day number: 1 to 31)
- Jam kerja (e.g. "7-14", "8", etc. or "-" if off/empty)
- atau / 工时 (Work hours number or "-")
- Jml.Kum / 累计 (Cumulative hours)
- Proses Produksi / 生产工序 (e.g. "A1", "Solder", "Lem", "Packing", "Gulung", etc.)
- Jml Target / 目标数量 (Target quantity number)
- Jml Prod / 生产数量 (Produced quantity number e.g. 331)
- Jml.Kum / 累计 (Cumulative produced quantity)
- Menget. / REMARK (Remark or notes)

CRITICAL INSTRUCTIONS:
1. Be concise. Output valid JSON immediately.
2. Only include days (1 to 31) that have actual recorded numbers or non-empty entries.
3. Ensure all numeric fields are numbers (not NaN).

JSON format:
\`\`\`json
{
  "no_karyawan": "string",
  "nama_karyawan": "string",
  "bulan": "string",
  "tgl_masuk": "string",
  "rows": [
    {
      "day": 1,
      "work_hours": "7-14",
      "cum_hours": 7,
      "process": "A1",
      "target_qty": 0,
      "prod_qty": 331,
      "cum_prod_qty": 331,
      "remark": ""
    }
  ]
}
\`\`\`
`

  const payload = {
    model: 'qwen/qwen3.6-27b',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          {
            type: 'image_url',
            image_url: { url: imageBase64 }
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1200
  }

  let response: Response | null = null
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    attempts++
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 429) {
      const errText = await response.text()
      const waitMatch = errText.match(/try again in ([\d\.]+)s/i)
      const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 15

      if (attempts < maxAttempts) {
        for (let s = waitSec; s > 0; s--) {
          if (onStatusUpdate) {
            onStatusUpdate(`Antrian AI padat, mencoba otomatis dalam ${s} detik...`)
          }
          await new Promise(r => setTimeout(r, 1000))
        }
        if (onStatusUpdate) {
          onStatusUpdate('Memproses ulang foto...')
        }
        continue
      } else {
        throw new Error(`Groq API Rate Limit (429): Silakan tunggu ${waitSec} detik lagi sebelum memindai ulang.`)
      }
    }

    break
  }

  if (!response || !response.ok) {
    const errText = (await response?.text()) || 'Unknown error'
    throw new Error(`Groq API Error (${response?.status || 'Unknown'}): ${errText}`)
  }

  const data = await response.json()
  const rawContent = data.choices?.[0]?.message?.content || ''

  // Parse JSON response, handling <think> tags or code blocks
  let jsonString = rawContent

  // 1. Strip completed <think>...</think>
  jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // 2. Extract content inside ```json ... ``` or find outermost { ... }
  const jsonBlockMatch = jsonString.match(/```(?:json)?([\s\S]*?)```/)
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    jsonString = jsonBlockMatch[1].trim()
  } else {
    // If <think> was unclosed, look for the first { in the entire text
    const firstBrace = rawContent.lastIndexOf('```json') !== -1 
      ? rawContent.indexOf('{', rawContent.lastIndexOf('```json'))
      : rawContent.indexOf('{')
    const lastBrace = rawContent.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      jsonString = rawContent.substring(firstBrace, lastBrace + 1)
    }
  }

  let parsed: any = tryParseJson(jsonString)

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.rows) || parsed.rows.length === 0) {
    const fallback = parseFallbackFromText(rawContent)
    parsed = {
      no_karyawan: parsed?.no_karyawan || fallback.no_karyawan || '',
      nama_karyawan: parsed?.nama_karyawan || fallback.nama_karyawan || '',
      bulan: parsed?.bulan || fallback.bulan || '',
      tgl_masuk: parsed?.tgl_masuk || fallback.tgl_masuk || '',
      rows: Array.isArray(parsed?.rows) && parsed.rows.length > 0 ? parsed.rows : fallback.rows
    }
  }

  const rawRows = Array.isArray(parsed.rows) ? parsed.rows : []
  const validRows: ScannedRowData[] = []

  for (const r of rawRows) {
    const day = Number(r.day || r.tgl)
    if (!day || isNaN(day) || day < 1 || day > 31) continue

    const prodQty = Number(r.prod_qty ?? r.jml_prod ?? 0)
    const targetQty = Number(r.target_qty ?? r.jml_target ?? 0)
    const workHours = String(r.work_hours ?? r.jam_kerja ?? '').trim()
    const process = String(r.process ?? r.proses_produksi ?? '').trim()
    const remark = String(r.remark ?? r.keterangan ?? '').trim()

    validRows.push({
      day,
      workHours: workHours || (prodQty > 0 ? '7' : '-'),
      cumHours: r.cum_hours ?? undefined,
      process: process || 'A1',
      targetQty: isNaN(targetQty) ? 0 : targetQty,
      prodQty: isNaN(prodQty) ? 0 : prodQty,
      cumProdQty: r.cum_prod_qty ?? undefined,
      remark
    })
  }

  // If parsed JSON yielded 0 rows, fallback to text pattern parsing
  if (validRows.length === 0) {
    const fallback = parseFallbackFromText(rawContent)
    if (fallback.rows.length > 0) {
      for (const r of fallback.rows) {
        validRows.push({
          day: r.day,
          workHours: r.work_hours || (r.prod_qty > 0 ? '7' : '-'),
          cumHours: r.cum_hours ?? undefined,
          process: r.process || 'A1',
          targetQty: r.target_qty || 0,
          prodQty: r.prod_qty || 0,
          cumProdQty: r.cum_prod_qty ?? undefined,
          remark: r.remark || ''
        })
      }
      if (!parsed.nama_karyawan && fallback.nama_karyawan) parsed.nama_karyawan = fallback.nama_karyawan
      if (!parsed.no_karyawan && fallback.no_karyawan) parsed.no_karyawan = fallback.no_karyawan
      if (!parsed.bulan && fallback.bulan) parsed.bulan = fallback.bulan
      if (!parsed.tgl_masuk && fallback.tgl_masuk) parsed.tgl_masuk = fallback.tgl_masuk
    }
  }

  // Sort rows ascending by day
  validRows.sort((a, b) => a.day - b.day)

  const rawMonth = parsed.bulan || ''
  const parsedMonthNumber = parseMonthString(rawMonth)

  return {
    rawWorkerName: parsed.nama_karyawan || parsed.nama || '',
    rawWorkerNo: parsed.no_karyawan || '',
    rawMonth,
    rawJoinedDate: parsed.tgl_masuk || '',
    parsedMonthNumber,
    rows: validRows
  }
}
