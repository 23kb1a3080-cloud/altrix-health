// Indic Numeral Mappings
const INDIC_DIGIT_MAP: Record<string, string> = {
  // Devanagari (Hindi)
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  // Telugu
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
  '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
}

export function parseIndicNumerals(text: string): string {
  if (!text) return ''
  return text
    .split('')
    .map((ch) => INDIC_DIGIT_MAP[ch] || ch)
    .join('')
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
}

export function parseISODate(rawDate: string): string | null {
  if (!rawDate) return null
  const cleaned = parseIndicNumerals(rawDate.trim())

  // Match YYYY-MM-DD
  const ymdMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Match DD-Mon-YYYY or DD-Month-YYYY
  const textMonthMatch = cleaned.match(/^(\d{1,2})[-/.\s]+([A-Za-z]+)[-/.\s]+(\d{4})$/)
  if (textMonthMatch) {
    const [, d, mon, y] = textMonthMatch
    const mNum = MONTH_NAMES[mon.toLowerCase()]
    if (mNum) {
      return `${y}-${mNum}-${d.padStart(2, '0')}`
    }
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return cleaned
}

export interface FrequencyParsed {
  standard: string
  doses_per_day: number
  timing: string
}

export function parseFrequency(rawFreq: string): FrequencyParsed {
  if (!rawFreq) return { standard: 'As directed', doses_per_day: 1, timing: 'Anytime' }
  const text = rawFreq.trim().toUpperCase()

  // Match pattern like 1-0-1, 1-1-1, 1-0-0, 0-0-1
  const numPattern = text.match(/^(\d)\s*[-/]\s*(\d)\s*[-/]\s*(\d)$/)
  if (numPattern) {
    const doses = parseInt(numPattern[1], 10) + parseInt(numPattern[2], 10) + parseInt(numPattern[3], 10)
    let timingDesc = 'Morning, Afternoon, Night'
    if (numPattern[1] === '1' && numPattern[2] === '0' && numPattern[3] === '1') timingDesc = 'Morning & Night'
    if (numPattern[1] === '1' && numPattern[2] === '0' && numPattern[3] === '0') timingDesc = 'Morning only'
    if (numPattern[1] === '0' && numPattern[2] === '0' && numPattern[3] === '1') timingDesc = 'Night only'
    return { standard: text, doses_per_day: doses, timing: timingDesc }
  }

  if (text.includes('OD') || text.includes('ONCE DAILY')) {
    return { standard: 'OD', doses_per_day: 1, timing: 'Once daily' }
  }
  if (text.includes('BD') || text.includes('BID') || text.includes('TWICE DAILY')) {
    return { standard: 'BD', doses_per_day: 2, timing: 'Twice daily' }
  }
  if (text.includes('TID') || text.includes('THRICE DAILY')) {
    return { standard: 'TID', doses_per_day: 3, timing: 'Three times daily' }
  }
  if (text.includes('QID')) {
    return { standard: 'QID', doses_per_day: 4, timing: 'Four times daily' }
  }
  if (text.includes('SOS') || text.includes('PRN')) {
    return { standard: 'PRN', doses_per_day: 1, timing: 'As needed' }
  }

  return { standard: rawFreq, doses_per_day: 1, timing: 'As directed' }
}

export function normalizeUnit(unit: string): string {
  if (!unit) return ''
  const u = unit.trim().toLowerCase()
  if (u === 'mg/dl' || u === 'mg/100ml') return 'mg/dL'
  if (u === 'g/dl' || u === 'gm/dl' || u === 'gm%') return 'g/dL'
  if (u.includes('10^6') || u.includes('mil/')) return '10^6/µL'
  if (u.includes('cells/cumm') || u.includes('cells/mcl') || u === '/cumm') return '/µL'
  if (u === '%' || u === 'percent') return '%'
  if (u === 'mmol/l') return 'mmol/L'
  return unit
}
