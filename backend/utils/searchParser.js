// backend/search/queryParser.js
// Rule-based vehicle query parser for Partly search
// Handles 80% of queries for free — Claude Haiku fallback for the rest

// Simple LRU cache for parsed queries — avoids re-running Claude on common queries
// Cache key: lowercase trimmed query. Cache value: parsed result.
const CACHE_MAX_SIZE = 500
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const queryCache = new Map()

function cacheGet(key) {
  const entry = queryCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    queryCache.delete(key)
    return null
  }
  // Move to end (LRU)
  queryCache.delete(key)
  queryCache.set(key, entry)
  return entry.value
}

function cacheSet(key, value) {
  if (queryCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest entry (Map preserves insertion order)
    const firstKey = queryCache.keys().next().value
    queryCache.delete(firstKey)
  }
  queryCache.set(key, { value, timestamp: Date.now() })
}

const MAKES = {
  // Maruti Suzuki
  'maruti': 'Maruti Suzuki', 'suzuki': 'Maruti Suzuki', 'maruti suzuki': 'Maruti Suzuki',
  // Hyundai
  'hyundai': 'Hyundai', 'hundai': 'Hyundai', 'hyunday': 'Hyundai',
  // Honda
  'honda': 'Honda',
  // Toyota
  'toyota': 'Toyota', 'toyata': 'Toyota',
  // Tata
  'tata': 'Tata',
  // Mahindra
  'mahindra': 'Mahindra', 'mahendra': 'Mahindra',
  // Kia
  'kia': 'Kia',
  // MG
  'mg': 'MG', 'morris garages': 'MG',
  // Ford
  'ford': 'Ford',
  // Volkswagen
  'volkswagen': 'Volkswagen', 'vw': 'Volkswagen',
  // Skoda
  'skoda': 'Skoda',
  // Renault
  'renault': 'Renault', 'renolt': 'Renault',
  // Nissan
  'nissan': 'Nissan',
  // Royal Enfield
  'royal enfield': 'Royal Enfield', 're': null, // 're' too ambiguous alone
  'royal': null, // too ambiguous alone
  // Hero
  'hero': 'Hero', 'hero honda': 'Hero',
  // Bajaj
  'bajaj': 'Bajaj',
  // TVS
  'tvs': 'TVS',
  // Yamaha
  'yamaha': 'Yamaha',
  // Kawasaki
  'kawasaki': 'Kawasaki',
  // Isuzu
  'isuzu': 'Isuzu',
  // Jeep
  'jeep': 'Jeep',
  // Datsun
  'datsun': 'Datsun',
  // Chevrolet
  'chevrolet': 'Chevrolet', 'chevy': 'Chevrolet',
  // Mitsubishi
  'mitsubishi': 'Mitsubishi',
}

const MODELS = {
  // Maruti
  'swift': 'Swift', 'swft': 'Swift', 'swyft': 'Swift',
  'swift dzire': 'Swift Dzire', 'dzire': 'Swift Dzire',
  'alto': 'Alto', 'alto 800': 'Alto 800', 'alto k10': 'Alto K10',
  'baleno': 'Baleno',
  'vitara brezza': 'Vitara Brezza', 'brezza': 'Vitara Brezza',
  'wagon r': 'Wagon R', 'wagonr': 'Wagon R',
  'ertiga': 'Ertiga',
  'ciaz': 'Ciaz',
  'celerio': 'Celerio',
  'ignis': 'Ignis',
  'jimny': 'Jimny',
  's-presso': 'S-Presso', 'spresso': 'S-Presso',
  'fronx': 'Fronx',
  'grand vitara': 'Grand Vitara',
  // Hyundai
  'i10': 'i10', 'grand i10': 'Grand i10',
  'i20': 'i20',
  'creta': 'Creta',
  'venue': 'Venue',
  'verna': 'Verna',
  'elantra': 'Elantra',
  'tucson': 'Tucson',
  'santro': 'Santro',
  'xcent': 'Xcent',
  'aura': 'Aura',
  'alcazar': 'Alcazar',
  // Honda
  'city': 'City',
  'amaze': 'Amaze',
  'jazz': 'Jazz',
  'wr-v': 'WR-V', 'wrv': 'WR-V',
  'elevate': 'Elevate',
  'activa': 'Activa', 'activa 6g': 'Activa 6G', 'activa 5g': 'Activa 5G',
  'shine': 'Shine',
  'unicorn': 'Unicorn',
  // Toyota
  'innova': 'Innova', 'innova crysta': 'Innova Crysta', 'crysta': 'Innova Crysta',
  'fortuner': 'Fortuner',
  'glanza': 'Glanza',
  'urban cruiser': 'Urban Cruiser',
  'camry': 'Camry',
  'corolla': 'Corolla',
  'land cruiser': 'Land Cruiser',
  // Tata
  'nexon': 'Nexon',
  'harrier': 'Harrier',
  'safari': 'Safari',
  'punch': 'Punch',
  'tiago': 'Tiago',
  'tigor': 'Tigor',
  'altroz': 'Altroz',
  'sumo': 'Sumo',
  'nano': 'Nano',
  'indica': 'Indica',
  'indigo': 'Indigo',
  // Mahindra
  'scorpio': 'Scorpio', 'scorpio n': 'Scorpio N', 'scorpio classic': 'Scorpio Classic',
  'thar': 'Thar',
  'xuv700': 'XUV700', 'xuv 700': 'XUV700',
  'xuv500': 'XUV500', 'xuv 500': 'XUV500',
  'xuv300': 'XUV300', 'xuv 300': 'XUV300',
  'bolero': 'Bolero',
  'marazzo': 'Marazzo',
  'kuv100': 'KUV100',
  // Kia
  'seltos': 'Seltos',
  'sonet': 'Sonet',
  'carnival': 'Carnival',
  'carens': 'Carens',
  'ev6': 'EV6',
  // MG
  'hector': 'Hector',
  'astor': 'Astor',
  'gloster': 'Gloster',
  'zs ev': 'ZS EV',
  // Royal Enfield
  'classic 350': 'Classic 350', 'classic350': 'Classic 350',
  'bullet': 'Bullet', 'bullet 350': 'Bullet 350',
  'meteor': 'Meteor', 'meteor 350': 'Meteor 350',
  'himalayan': 'Himalayan',
  'interceptor': 'Interceptor 650', 'interceptor 650': 'Interceptor 650',
  'continental gt': 'Continental GT',
  'thunderbird': 'Thunderbird',
  // Bajaj
  'pulsar': 'Pulsar', 'pulsar 150': 'Pulsar 150', 'pulsar 200': 'Pulsar 200', 'pulsar ns200': 'Pulsar NS200',
  'dominar': 'Dominar', 'dominar 400': 'Dominar 400',
  'avenger': 'Avenger',
  'platina': 'Platina',
  'ct 100': 'CT 100',
  // TVS
  'apache': 'Apache', 'apache rtr': 'Apache RTR', 'apache rr310': 'Apache RR310',
  'jupiter': 'Jupiter',
  'ntorq': 'Ntorq', 'ntorq 125': 'Ntorq 125',
  'sport': 'Sport',
  'radeon': 'Radeon',
  // Yamaha
  'r15': 'R15', 'yzf r15': 'R15',
  'fz': 'FZ', 'fz s': 'FZ-S', 'fz25': 'FZ25',
  'mt15': 'MT-15', 'mt 15': 'MT-15',
  'fascino': 'Fascino',
  'ray z': 'Ray Z',
  'rd': null, // too ambiguous
  // Ford
  'ecosport': 'EcoSport', 'eco sport': 'EcoSport',
  'endeavour': 'Endeavour',
  'aspire': 'Aspire',
  'figo': 'Figo',
  // Volkswagen
  'polo': 'Polo',
  'vento': 'Vento',
  'taigun': 'Taigun',
  'virtus': 'Virtus',
  // Skoda
  'kushaq': 'Kushaq',
  'slavia': 'Slavia',
  'octavia': 'Octavia',
  // Renault
  'kwid': 'Kwid',
  'duster': 'Duster',
  'triber': 'Triber',
  'kiger': 'Kiger',
  // Nissan
  'magnite': 'Magnite',
  'kicks': 'Kicks',
  'terrano': 'Terrano',
  // Isuzu
  'd-max': 'D-Max', 'dmax': 'D-Max',
  // Mitsubishi
  'pajero': 'Pajero', 'pajero sport': 'Pajero Sport',
  'outlander': 'Outlander',
}

const PART_POSITIONS = ['front', 'rear', 'back', 'left', 'right', 'driver', 'passenger', 'upper', 'lower', 'inner', 'outer']
const CONDITIONS = { 'used': 'used', 'second hand': 'used', 'secondhand': 'used', '2nd hand': 'used', 'old': 'used', 'new': 'new', 'original': 'new', 'oem': 'new', 'genuine': 'new' }

/**
 * Rule-based parser — extracts make, model, year, condition from query
 * Returns { cleanQuery, make, model, year, condition, position }
 */
function parseQueryRuleBased(q) {
  if (!q) return { cleanQuery: q, make: null, model: null, year: null, condition: null }
  const lower = q.toLowerCase().trim()
  let remaining = lower
  let make = null, model = null, year = null, condition = null, position = null

  // Extract year (4-digit 19xx or 20xx)
  const yearMatch = remaining.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  if (yearMatch) {
    year = parseInt(yearMatch[1])
    remaining = remaining.replace(yearMatch[0], ' ').trim()
  }

  // Extract condition
  for (const [key, val] of Object.entries(CONDITIONS)) {
    if (remaining.includes(key)) {
      condition = val
      remaining = remaining.replace(key, ' ').trim()
      break
    }
  }

  // Extract position
  for (const pos of PART_POSITIONS) {
    if (remaining.includes(pos)) {
      position = pos
      break
    }
  }

  // Try multi-word models first (longest match wins)
  const modelKeys = Object.keys(MODELS).sort((a, b) => b.length - a.length)
  for (const key of modelKeys) {
    if (remaining.includes(key) && MODELS[key]) {
      model = MODELS[key]
      remaining = remaining.replace(key, ' ').trim()
      break
    }
  }

  // Try multi-word makes (longest match first)
  const makeKeys = Object.keys(MAKES).sort((a, b) => b.length - a.length)
  for (const key of makeKeys) {
    if (remaining.includes(key) && MAKES[key]) {
      make = MAKES[key]
      remaining = remaining.replace(key, ' ').trim()
      break
    }
  }

  // Clean up remaining query
  const cleanQuery = remaining.replace(/\s+/g, ' ').trim() || q

  return { cleanQuery, make, model, year, condition, position }
}

/**
 * Confidence score — how well did rule-based parse the query?
 * High confidence = skip Claude. Low confidence = use Claude.
 */
function parseConfidence(result, originalQuery) {
  let score = 0
  if (result.make)  score += 40
  if (result.model) score += 30
  if (result.year)  score += 20
  if (result.condition) score += 10
  // If remaining clean query is short relative to original, good parse
  const remainingRatio = result.cleanQuery.length / originalQuery.length
  if (remainingRatio < 0.5) score += 10
  return score
}

/**
 * Claude Haiku fallback for complex queries
 * Only called when rule-based confidence < 30
 */
async function parseWithClaude(q, anthropicKey) {
  if (!anthropicKey) return null
  try {
    const cacheKey = q.toLowerCase().trim()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You are a vehicle parts search parser for an Indian auto parts marketplace.
Extract vehicle info from search queries. Return ONLY valid JSON, no other text.
Common Indian makes: Maruti Suzuki, Hyundai, Honda, Toyota, Tata, Mahindra, Kia, MG, Renault, Nissan, Royal Enfield, Bajaj, TVS, Hero, Yamaha, Kawasaki.
For "used" parts, condition = "used". For "new/original/OEM/genuine", condition = "new".`,
        messages: [{
          role: 'user',
          content: `Parse this auto parts search query: "${q}"

Return JSON:
{
  "make": "brand name or null",
  "model": "model name or null", 
  "year": year_number_or_null,
  "condition": "new" or "used" or null,
  "cleanQuery": "remaining search terms after removing vehicle info"
}`
        }]
      })
    })

    if (!response.ok) return null
    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    return {
      make:       json.make || null,
      model:      json.model || null,
      year:       json.year || null,
      condition:  json.condition || null,
      cleanQuery: json.cleanQuery || q,
    }
  } catch {
    return null
  }
}

/**
 * Main parse function — rule-based first, Claude fallback if needed
 * Results are cached for 24h to avoid re-parsing identical queries
 */
async function parseSearchQuery(q, anthropicKey) {
  if (!q) return { cleanQuery: '', make: null, model: null, year: null, condition: null }

  const cacheKey = q.toLowerCase().trim()
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const ruleResult = parseQueryRuleBased(q)
  const confidence = parseConfidence(ruleResult, q)

  // High confidence — use rule-based result
  if (confidence >= 30) {
    cacheSet(cacheKey, ruleResult)
    return ruleResult
  }

  // Low confidence — try Claude Haiku
  if (anthropicKey) {
    const claudeResult = await parseWithClaude(q, anthropicKey)
    if (claudeResult) {
      cacheSet(cacheKey, claudeResult)
      return claudeResult
    }
  }

  // Fallback — use rule-based even if low confidence
  cacheSet(cacheKey, ruleResult)
  return ruleResult
}

module.exports = { parseSearchQuery, parseQueryRuleBased }

/**
 * Normalize seller-entered fitment fields
 * Input: { vehicle_make: "honda", vehicle_model: "citi", vehicle_year: "2019" }
 * Output: { fitment_make: "Honda", fitment_model: "City", fitment_year_from: 2019 }
 */
async function normalizeFitment({ make, model, year }, anthropicKey) {
  const cacheKey = `fitment:${(make||'').toLowerCase().trim()}|${(model||'').toLowerCase().trim()}|${year||''}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const result = { make: null, model: null, year: null }

  // Year — just parse
  if (year) {
    const y = parseInt(year)
    if (y >= 1950 && y <= 2030) result.year = y
  }

  // Try rule-based normalization first (free, instant)
  if (make) {
    const lower = make.toLowerCase().trim()
    // Find longest matching make key
    const makeKeys = Object.keys(MAKES).sort((a, b) => b.length - a.length)
    for (const key of makeKeys) {
      if (lower === key || lower.includes(key)) {
        if (MAKES[key]) { result.make = MAKES[key]; break }
      }
    }
    if (!result.make) result.make = make.trim() // keep as-is if unknown
  }

  if (model) {
    const lower = model.toLowerCase().trim()
    const modelKeys = Object.keys(MODELS).sort((a, b) => b.length - a.length)
    for (const key of modelKeys) {
      if (lower === key || lower.includes(key)) {
        if (MODELS[key]) { result.model = MODELS[key]; break }
      }
    }
    if (!result.model) result.model = model.trim()
  }

  // If rule-based didn't recognize make/model AND we have Claude key, ask Claude
  const needsClaude = anthropicKey && (
    (make && result.make === make.trim() && !Object.values(MAKES).includes(result.make)) ||
    (model && result.model === model.trim() && !Object.values(MODELS).includes(result.model))
  )

  if (needsClaude) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: `You normalize Indian vehicle make/model names. Common makes: Maruti Suzuki, Hyundai, Honda, Toyota, Tata, Mahindra, Kia, MG, Renault, Nissan, Royal Enfield, Bajaj, TVS, Hero, Yamaha, Kawasaki, Volkswagen, Skoda, Ford. Fix typos and use the proper full brand name. Return ONLY JSON.`,
          messages: [{
            role: 'user',
            content: `Normalize this Indian vehicle:
make: "${make || ''}"
model: "${model || ''}"

Return JSON:
{"make": "Proper Make Name or empty string", "model": "Proper Model Name or empty string"}`
          }]
        })
      })
      if (response.ok) {
        const data = await response.json()
        const text = data.content?.[0]?.text || ''
        const json = JSON.parse(text.replace(/```json|```/g, '').trim())
        if (json.make)  result.make  = json.make
        if (json.model) result.model = json.model
      }
    } catch {}
  }

  cacheSet(cacheKey, result)
  return result
}

module.exports.normalizeFitment = normalizeFitment