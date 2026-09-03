import { createSwissEph, HouseSystem, Flag, Body as SweBody } from '@kuntay/swisseph';
import type { PlanetaData as PlanetData, CasaData as HouseData, AspectoData as AspectData } from './supabase';
import moment from 'moment-timezone/builds/moment-timezone-with-data';
import * as Astronomy from 'astronomy-engine';

// ============================================================
// SWISS EPHEMERIS SINGLETON (Placidus Houses)
// ============================================================
let _swe: Awaited<ReturnType<typeof createSwissEph>> | null = null;

export async function initAstrology(): Promise<void> {
  if (!_swe) {
    _swe = await createSwissEph();
  }
}

function getSwe() {
  if (!_swe) throw new Error('Swiss Ephemeris not initialized. Call initAstrology() first.');
  return _swe;
}

// Zodiac signs in order
export const SIGNS = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
];

export const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
export const SIGN_ELEMENTS = ['Fogo', 'Terra', 'Ar', 'Água', 'Fogo', 'Terra', 'Ar', 'Água', 'Fogo', 'Terra', 'Ar', 'Água'];
export const SIGN_MODALITIES = ['Cardinal', 'Fixo', 'Mutável', 'Cardinal', 'Fixo', 'Mutável', 'Cardinal', 'Fixo', 'Mutável', 'Cardinal', 'Fixo', 'Mutável'];
export const SIGN_COLORS = [
  '#FF4136', '#2ECC40', '#FFDC00', '#7FDBFF',
  '#FF851B', '#B10DC9', '#39CCCC', '#85144b',
  '#01FF70', '#001f3f', '#0074D9', '#B0C4DE'
];

export const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☀️', moon: '🌙', mercury: '☿', venus: '♀️', mars: '♂️',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  ascendant: '⬆️', midheaven: '⬆️'
};

export const PLANET_NAMES: Record<string, string> = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
  jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão'
};

export const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '✶',
  quincunx: '⊻', semisquare: '∠'
};

export const ASPECT_ORBS: Record<string, number> = {
  conjunction: 8, opposition: 8, trine: 7, square: 7,
  sextile: 5, quincunx: 3, semisquare: 3
};

export const ASPECT_DEGREES: Record<string, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120,
  quincunx: 150, opposition: 180, semisquare: 45
};

// ============================================================
// ASTRONOMY-ENGINE BASED CALCULATIONS (NASA-level precision)
// ============================================================

// Map our planet keys to astronomy-engine Body enum
const BODY_MAP: Record<string, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

// Get geocentric ecliptic longitude of a body using astronomy-engine
function getBodyLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Sun) {
    const sunPos = Astronomy.SunPosition(time);
    return sunPos.elon;
  }
  
  // For all other planets/moon, we must use Geocentric vector
  // The 'true' parameter applies aberration of light correction
  const geoVector = Astronomy.GeoVector(body, time, true);
  
  // Convert Cartesian geocentric vector to Ecliptic angular coordinates
  const ecliptic = Astronomy.Ecliptic(geoVector);
  return ecliptic.elon;
}

// Convert ecliptic longitude to sign and degree
function longitudeToSign(longitude: number): { sign: string; degree: number; signIndex: number } {
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);
  const degree = lon % 30;
  return { sign: SIGNS[signIndex], degree: Math.round(degree * 100) / 100, signIndex };
}

// Calculate Ascendant using proper spherical trigonometry
export function calculateAscendant(time: Astronomy.AstroTime, lat: number, lon: number): number {
  // Calculate Local Sidereal Time
  const gast = Astronomy.SiderealTime(time); // Greenwich Apparent Sidereal Time in hours
  const lstHours = ((gast + lon / 15) % 24 + 24) % 24;
  const lstDeg = lstHours * 15; // Convert to degrees
  const lstRad = lstDeg * Math.PI / 180;

  // Obliquity of the ecliptic (accurate formula)
  const Tc = (time.ut) / 36525; // time.ut is already JD - 2451545.0 in days
  const eps = (23.4392911 - 0.0130042 * Tc - 0.00000164 * Tc * Tc) * Math.PI / 180;

  const latRad = lat * Math.PI / 180;

  // Standard ascendant formula
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;

  // Resolve quadrant ambiguity: the Ascendant must be in the same half-sky as the LST.
  // If the difference between ASC and LST longitude is more than 180°, we got the Descendant instead.
  // Fix by adding 180°.
  const lstLon = lstDeg % 360;
  const diff = ((asc - lstLon) % 360 + 360) % 360;
  if (diff > 180) {
    asc = (asc + 180) % 360;
  }

  return asc;
}

// Calculate Midheaven (MC) from RAMC - proper method
// MC is the ecliptic longitude of the upper meridian
function calculateMC(time: Astronomy.AstroTime, lon: number): number {
  const gast = Astronomy.SiderealTime(time);
  const lstHours = ((gast + lon / 15) % 24 + 24) % 24;
  const ramc = lstHours * 15; // RAMC in degrees (Right Ascension of Midheaven)
  const ramcRad = ramc * Math.PI / 180;

  // Obliquity of the ecliptic
  const Tc = time.ut / 36525;
  const eps = (23.4392911 - 0.0130042 * Tc - 0.00000164 * Tc * Tc) * Math.PI / 180;

  // MC formula: tan(MC) = tan(RAMC) / cos(eps)
  let mc = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(eps)) * 180 / Math.PI;
  mc = ((mc % 360) + 360) % 360;
  return mc;
}

// Calculate Placidus house cusps using Swiss Ephemeris
function calculatePlacidusHouses(jdUt: number, lat: number, lon: number): { cusps: number[], asc: number, mc: number } {
  const swe = getSwe();
  const result = swe.houses(jdUt, lat, lon, HouseSystem.Placidus);
  return { cusps: result.cusps, asc: result.ascendant, mc: result.midheaven };
}

// Find which Placidus house a planet is in given the 12 house cusps
function getPlanetHouseFromCusps(planetLon: number, cusps: number[]): number {
  const lon = ((planetLon % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      // Cusp crosses 0°
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return 1;
}

// Build houses Record from Placidus cusps
function buildHousesRecord(cusps: number[]): Record<string, HouseData> {
  const houses: Record<string, HouseData> = {};
  for (let i = 0; i < 12; i++) {
    const { sign, degree } = longitudeToSign(cusps[i]);
    houses[(i + 1).toString()] = { sign, degree };
  }
  return houses;
}

// Calculate aspects between planets
function calculateAspects(positions: Record<string, number>): AspectData[] {
  const aspects: AspectData[] = [];
  const planetList = Object.entries(positions);

  for (let i = 0; i < planetList.length; i++) {
    for (let j = i + 1; j < planetList.length; j++) {
      const [p1, lon1] = planetList[i];
      const [p2, lon2] = planetList[j];
      const diff = Math.abs(((lon1 - lon2 + 360) % 360));
      const angle = diff > 180 ? 360 - diff : diff;

      for (const [aspectName, targetAngle] of Object.entries(ASPECT_DEGREES)) {
        const orb = Math.abs(angle - targetAngle);
        if (orb <= ASPECT_ORBS[aspectName]) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type: aspectName,
            orb: Math.round(orb * 10) / 10,
            symbol: ASPECT_SYMBOLS[aspectName],
          });
          break;
        }
      }
    }
  }
  return aspects;
}

// Check if a planet is retrograde by comparing positions 1 day apart
function isRetrograde(body: Astronomy.Body, time: Astronomy.AstroTime): boolean {
  if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;

  const timeBefore = Astronomy.MakeTime(new Date(time.date.getTime() - 86400000));
  const timeAfter = Astronomy.MakeTime(new Date(time.date.getTime() + 86400000));

  const lonBefore = getBodyLongitude(body, timeBefore);
  const lonAfter = getBodyLongitude(body, timeAfter);

  let diff = lonAfter - lonBefore;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

// Calculate personal arcanum (numerology)
export function calculatePersonalArcanum(birthDateStr: string): number {
  const digits = birthDateStr.replace(/-/g, '').split('').reduce((a, b) => a + parseInt(b), 0);
  let result = digits;
  while (result > 22) {
    result = result.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return result === 0 ? 22 : result;
}

// Calculate arcanum of the year
export function calculateYearArcanum(birthDate: string, year?: number): number {
  const [, month, day] = birthDate.split('-').map(Number);
  const currentYear = year || new Date().getFullYear();
  const sum = day + month + currentYear;
  const digits = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);

  let result = digits;
  while (result > 22) {
    result = result.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return result === 0 ? 22 : result;
}

// ============================================================
// MAIN CHART CALCULATION
// ============================================================

export interface BirthChartInput {
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM or null
  lat: number;
  lon: number;
  timezone?: string;
}

export interface CalculatedChart {
  sun: { sign: string; degree: number };
  moon: { sign: string; degree: number };
  ascendant: { sign: string; degree: number } | null;
  midheaven: { sign: string; degree: number } | null;
  planets: Record<string, PlanetData>;
  houses: Record<string, HouseData>;
  aspects: AspectData[];
  venus_sign: string;
  personal_arcanum: number;
}

export function calculateBirthChart(input: BirthChartInput, birthDateStr: string): CalculatedChart {
  const { birthDate, birthTime, lat, lon, timezone } = input;
  const [year, month, day] = birthDate.split('-').map(Number);
  let hour = 12, minute = 0; // Default to noon if no time

  if (birthTime) {
    const [h, m] = birthTime.split(':').map(Number);
    hour = h;
    minute = m;
  }

  // Calculate UTC date based on correct timezone
  let date: Date;
  if (timezone && birthTime) {
    const mDate = moment.tz(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      'YYYY-MM-DD HH:mm',
      timezone
    );
    date = mDate.toDate();
  } else {
    date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  }

  // Create astronomy-engine time object
  const time = Astronomy.MakeTime(date);

  // Calculate all planetary positions using astronomy-engine
  const sunLon = getBodyLongitude(Astronomy.Body.Sun, time);
  const moonLon = getBodyLongitude(Astronomy.Body.Moon, time);

  // Calculate Julian Day UT for Swiss Ephemeris
  const jdUt = 2451545.0 + time.ut;

  // Calculate Placidus houses using Swiss Ephemeris (same engine as Astro-Seek)
  let placidusResult: { cusps: number[], asc: number, mc: number } | null = null;
  let ascLon: number | null = null;
  let mcLon: number | null = null;

  if (birthTime) {
    try {
      placidusResult = calculatePlacidusHouses(jdUt, lat, lon);
      ascLon = placidusResult.asc;
      mcLon = placidusResult.mc;
    } catch {
      // Fallback to astronomy-engine if swisseph not ready
      ascLon = calculateAscendant(time, lat, lon);
      mcLon = calculateMC(time, lon);
    }
  }

  const sun = longitudeToSign(sunLon);
  const moon = longitudeToSign(moonLon);

  // Use Placidus cusps if available, otherwise build Equal House cusps from ASC
  let houseCusps: number[] | null = placidusResult?.cusps ?? null;
  if (!houseCusps && ascLon !== null) {
    // Equal House fallback: 12 cusps of 30° each starting from ASC
    houseCusps = Array.from({ length: 12 }, (_, i) => ((ascLon! + i * 30) % 360 + 360) % 360);
  }

  const planetNames = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const planetPositions: Record<string, number> = {
    sun: sunLon, moon: moonLon,
  };

  const planets: Record<string, PlanetData> = {
    sun: {
      sign: sun.sign,
      degree: sun.degree,
      house: houseCusps ? getPlanetHouseFromCusps(sunLon, houseCusps) : undefined,
      retrograde: false,
    },
    moon: {
      sign: moon.sign,
      degree: moon.degree,
      house: houseCusps ? getPlanetHouseFromCusps(moonLon, houseCusps) : undefined,
      retrograde: false,
    },
  };

  for (const planetKey of planetNames) {
    const body = BODY_MAP[planetKey];
    const lon_val = getBodyLongitude(body, time);
    planetPositions[planetKey] = lon_val;
    const { sign, degree } = longitudeToSign(lon_val);
    planets[planetKey] = {
      sign,
      degree,
      house: houseCusps ? getPlanetHouseFromCusps(lon_val, houseCusps) : undefined,
      retrograde: isRetrograde(body, time),
    };
  }

  // Houses (Placidus from Swiss Ephemeris, or Equal House fallback)
  const houses = houseCusps ? buildHousesRecord(houseCusps) : {};

  // Aspects
  const aspects = calculateAspects(planetPositions);

  // Venus sign
  const venusSign = planets.venus.sign || '';

  // Personal arcanum
  const personalArcanum = calculatePersonalArcanum(birthDateStr);

  return {
    sun: { sign: sun.sign, degree: sun.degree },
    moon: { sign: moon.sign, degree: moon.degree },
    ascendant: ascLon !== null ? longitudeToSign(ascLon) : null,
    midheaven: mcLon !== null ? longitudeToSign(mcLon) : null,
    planets,
    houses,
    aspects,
    venus_sign: venusSign,
    personal_arcanum: personalArcanum,
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Get current moon phase
export function getMoonPhase(): { phase: string; illumination: number; emoji: string } {
  const time = Astronomy.MakeTime(new Date());
  const sunLon = getBodyLongitude(Astronomy.Body.Sun, time);
  const moonLon = getBodyLongitude(Astronomy.Body.Moon, time);
  let diff = ((moonLon - sunLon) % 360 + 360) % 360;

  let phase: string;
  let emoji: string;
  if (diff < 22.5) { phase = 'Lua Nova'; emoji = '🌑'; }
  else if (diff < 67.5) { phase = 'Lua Crescente'; emoji = '🌒'; }
  else if (diff < 112.5) { phase = 'Quarto Crescente'; emoji = '🌓'; }
  else if (diff < 157.5) { phase = 'Lua Gibosa Crescente'; emoji = '🌔'; }
  else if (diff < 202.5) { phase = 'Lua Cheia'; emoji = '🌕'; }
  else if (diff < 247.5) { phase = 'Lua Gibosa Minguante'; emoji = '🌖'; }
  else if (diff < 292.5) { phase = 'Quarto Minguante'; emoji = '🌗'; }
  else if (diff < 337.5) { phase = 'Lua Minguante'; emoji = '🌘'; }
  else { phase = 'Lua Nova'; emoji = '🌑'; }

  const illumination = Math.round((1 - Math.cos(diff * Math.PI / 180)) / 2 * 100);
  return { phase, illumination, emoji };
}

// Get current transits
export function getCurrentTransits(): Array<{ planet: string; sign: string; retrograde: boolean }> {
  const time = Astronomy.MakeTime(new Date());
  const transitPlanets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  return transitPlanets.map(planetKey => {
    const body = BODY_MAP[planetKey];
    const lon = getBodyLongitude(body, time);
    const { sign } = longitudeToSign(lon);
    return { planet: planetKey, sign, retrograde: isRetrograde(body, time) };
  });
}

// Get sign index
export function getSignIndex(sign: string): number {
  return SIGNS.indexOf(sign);
}

// Get sign from sun date (traditional, used as fallback)
export function getSignFromDate(month: number, day: number): string {
  const dates = [
    [3, 21], [4, 20], [5, 21], [6, 21], [7, 23], [8, 23],
    [9, 23], [10, 23], [11, 22], [12, 22], [1, 20], [2, 19]
  ];
  for (let i = 0; i < 12; i++) {
    const [m, d] = dates[i];
    if (month === m && day >= d) return SIGNS[i];
    if (month === dates[(i + 1) % 12][0] && day < dates[(i + 1) % 12][1]) return SIGNS[i];
  }
  return SIGNS[11];
}

// ============================================================
// SYNASTRY — DETERMINISTIC SCORING ENGINE
// ============================================================

export interface SinastryScores {
  love: number;
  communication: number;
  chemistry: number;
  relationship: number;
  overall: number;
  interAspects: SinastryAspect[];
}

export interface SinastryAspect {
  planet1: string;       // Planet from chart 1
  planet2: string;       // Planet from chart 2
  type: string;          // conjunction, trine, etc.
  orb: number;
  symbol: string;
  influence: 'positive' | 'negative' | 'neutral';
}

// Base influence of each aspect type (positive = harmonious, negative = tense)
const ASPECT_INFLUENCE: Record<string, { score: number; type: 'positive' | 'negative' | 'neutral' }> = {
  conjunction: { score: 10, type: 'neutral' },  // depends on planets
  trine:       { score: 10, type: 'positive' },
  sextile:     { score: 7,  type: 'positive' },
  square:      { score: -6, type: 'negative' },
  opposition:  { score: -4, type: 'negative' },
  quincunx:    { score: -3, type: 'negative' },
  semisquare:  { score: -2, type: 'negative' },
};

// Planets considered "benefic" in conjunctions (conjunction amplifies their nature)
const BENEFIC_PLANETS = new Set(['venus', 'jupiter', 'sun', 'moon']);
const MALEFIC_PLANETS = new Set(['saturn', 'pluto', 'mars']);

// Weight matrix: how much each planet pair influences each category
// [love, communication, chemistry, relationship]
type CategoryWeights = [number, number, number, number];

const PAIR_WEIGHTS: Record<string, CategoryWeights> = {
  // Sun interactions
  'sun-sun':       [2, 2, 2, 3],
  'sun-moon':      [3, 2, 1, 3],
  'sun-mercury':   [1, 3, 1, 2],
  'sun-venus':     [3, 1, 2, 2],
  'sun-mars':      [1, 1, 3, 2],
  'sun-jupiter':   [2, 2, 2, 3],
  'sun-saturn':    [1, 1, 1, 3],
  'sun-uranus':    [1, 1, 2, 1],
  'sun-neptune':   [2, 1, 2, 1],
  'sun-pluto':     [1, 1, 2, 2],

  // Moon interactions
  'moon-moon':     [2, 3, 1, 3],
  'moon-mercury':  [1, 3, 1, 2],
  'moon-venus':    [3, 2, 2, 3],
  'moon-mars':     [2, 1, 3, 2],
  'moon-jupiter':  [2, 2, 1, 3],
  'moon-saturn':   [1, 1, 1, 3],
  'moon-uranus':   [1, 1, 2, 1],
  'moon-neptune':  [3, 1, 2, 2],
  'moon-pluto':    [2, 1, 2, 2],

  // Mercury interactions
  'mercury-mercury': [1, 3, 1, 2],
  'mercury-venus':   [2, 3, 1, 2],
  'mercury-mars':    [1, 2, 2, 1],
  'mercury-jupiter': [1, 3, 1, 2],
  'mercury-saturn':  [0, 2, 0, 2],
  'mercury-uranus':  [0, 2, 1, 1],
  'mercury-neptune': [1, 2, 1, 1],
  'mercury-pluto':   [0, 2, 1, 1],

  // Venus interactions
  'venus-venus':   [3, 2, 2, 2],
  'venus-mars':    [3, 1, 3, 2],
  'venus-jupiter': [3, 1, 2, 2],
  'venus-saturn':  [2, 1, 1, 3],
  'venus-uranus':  [2, 1, 2, 1],
  'venus-neptune': [3, 1, 2, 1],
  'venus-pluto':   [2, 1, 3, 2],

  // Mars interactions
  'mars-mars':     [1, 1, 3, 1],
  'mars-jupiter':  [1, 1, 3, 2],
  'mars-saturn':   [0, 1, 1, 2],
  'mars-uranus':   [0, 1, 2, 1],
  'mars-neptune':  [1, 0, 2, 1],
  'mars-pluto':    [1, 0, 3, 1],

  // Outer planet interactions (less personal weight)
  'jupiter-saturn':  [1, 1, 1, 2],
  'jupiter-uranus':  [1, 1, 1, 1],
  'jupiter-neptune': [1, 1, 1, 1],
  'jupiter-pluto':   [1, 1, 1, 1],
  'saturn-uranus':   [0, 0, 0, 1],
  'saturn-neptune':  [0, 0, 0, 1],
  'saturn-pluto':    [0, 0, 0, 1],
  'uranus-neptune':  [0, 0, 0, 0],
  'uranus-pluto':    [0, 0, 0, 0],
  'neptune-pluto':   [0, 0, 0, 0],
};

// Get weights for a pair (handles both orderings)
function getPairWeights(p1: string, p2: string): CategoryWeights {
  return PAIR_WEIGHTS[`${p1}-${p2}`] || PAIR_WEIGHTS[`${p2}-${p1}`] || [1, 1, 1, 1];
}

/**
 * Calculate inter-chart aspects between two birth charts.
 * Unlike intra-chart aspects (within one chart), this compares
 * every planet in chart1 against every planet in chart2.
 */
export function calculateSinastryAspects(
  chart1: CalculatedChart,
  chart2: CalculatedChart
): SinastryAspect[] {
  const aspects: SinastryAspect[] = [];
  const planets1 = chart1.planets || {};
  const planets2 = chart2.planets || {};

  // We need ecliptic longitudes — reconstruct from sign + degree
  const getLongitude = (planet: any): number => {
    if (!planet) return 0;
    const signIndex = SIGNS.indexOf(planet.sign);
    if (signIndex === -1) return 0;
    return signIndex * 30 + (planet.degree || 0);
  };

  const p1Entries = Object.entries(planets1);
  const p2Entries = Object.entries(planets2);

  for (const [key1, planet1] of p1Entries) {
    const lon1 = getLongitude(planet1);

    for (const [key2, planet2] of p2Entries) {
      const lon2 = getLongitude(planet2);

      const diff = Math.abs(((lon1 - lon2 + 360) % 360));
      const angle = diff > 180 ? 360 - diff : diff;

      for (const [aspectName, targetAngle] of Object.entries(ASPECT_DEGREES)) {
        const orb = Math.abs(angle - targetAngle);
        if (orb <= ASPECT_ORBS[aspectName]) {
          // Determine if this conjunction is benefic or malefic
          let influence = ASPECT_INFLUENCE[aspectName].type;
          if (aspectName === 'conjunction') {
            const hasBenefic = BENEFIC_PLANETS.has(key1) || BENEFIC_PLANETS.has(key2);
            const hasMalefic = MALEFIC_PLANETS.has(key1) && MALEFIC_PLANETS.has(key2);
            influence = hasMalefic ? 'negative' : (hasBenefic ? 'positive' : 'neutral');
          }

          aspects.push({
            planet1: key1,
            planet2: key2,
            type: aspectName,
            orb: Math.round(orb * 10) / 10,
            symbol: ASPECT_SYMBOLS[aspectName],
            influence,
          });
          break; // Only one aspect per planet pair
        }
      }
    }
  }

  return aspects;
}

/**
 * Calculate deterministic synastry scores between two charts.
 * Returns fixed percentages for love, communication, chemistry, and relationship.
 * The same two charts will ALWAYS produce the same scores.
 */
export function calculateSinastryScores(
  chart1: CalculatedChart,
  chart2: CalculatedChart
): SinastryScores {
  const interAspects = calculateSinastryAspects(chart1, chart2);

  // Raw scores per category (will be normalized later)
  let rawLove = 0;
  let rawComm = 0;
  let rawChem = 0;
  let rawRel = 0;

  // Maximum possible positive score (for normalization)
  let maxLove = 0;
  let maxComm = 0;
  let maxChem = 0;
  let maxRel = 0;

  for (const aspect of interAspects) {
    const baseScore = ASPECT_INFLUENCE[aspect.type]?.score || 0;
    const weights = getPairWeights(aspect.planet1, aspect.planet2);

    // Orb factor: tighter orb = stronger effect (1.0 at orb=0, 0.3 at max orb)
    const maxOrb = ASPECT_ORBS[aspect.type] || 8;
    const orbFactor = 1 - (aspect.orb / maxOrb) * 0.7;

    // For conjunctions, determine sign of base score from influence
    let effectiveScore = baseScore;
    if (aspect.type === 'conjunction') {
      effectiveScore = aspect.influence === 'negative' ? -4 : 10;
    }

    const weightedScore = effectiveScore * orbFactor;

    // Accumulate into categories
    rawLove += weightedScore * weights[0];
    rawComm += weightedScore * weights[1];
    rawChem += weightedScore * weights[2];
    rawRel  += weightedScore * weights[3];

    // Track max possible positive contribution
    const maxScore = Math.abs(effectiveScore) * weights[0]; // rough max
    maxLove += Math.abs(effectiveScore) * weights[0];
    maxComm += Math.abs(effectiveScore) * weights[1];
    maxChem += Math.abs(effectiveScore) * weights[2];
    maxRel  += Math.abs(effectiveScore) * weights[3];
  }

  // Element compatibility bonus
  const sun1Element = SIGN_ELEMENTS[SIGNS.indexOf(chart1.sun?.sign || '')] || '';
  const sun2Element = SIGN_ELEMENTS[SIGNS.indexOf(chart2.sun?.sign || '')] || '';
  const moon1Element = SIGN_ELEMENTS[SIGNS.indexOf(chart1.moon?.sign || '')] || '';
  const moon2Element = SIGN_ELEMENTS[SIGNS.indexOf(chart2.moon?.sign || '')] || '';

  const elementCompatible = (e1: string, e2: string): number => {
    if (e1 === e2) return 8; // Same element
    if ((e1 === 'Fogo' && e2 === 'Ar') || (e1 === 'Ar' && e2 === 'Fogo')) return 6;
    if ((e1 === 'Terra' && e2 === 'Água') || (e1 === 'Água' && e2 === 'Terra')) return 6;
    if ((e1 === 'Fogo' && e2 === 'Terra') || (e1 === 'Terra' && e2 === 'Fogo')) return 2;
    if ((e1 === 'Ar' && e2 === 'Água') || (e1 === 'Água' && e2 === 'Ar')) return 2;
    return 4;
  };

  const sunElementBonus = elementCompatible(sun1Element, sun2Element);
  const moonElementBonus = elementCompatible(moon1Element, moon2Element);

  rawLove += sunElementBonus * 2 + moonElementBonus * 2;
  rawComm += sunElementBonus + moonElementBonus;
  rawChem += sunElementBonus * 1.5;
  rawRel  += sunElementBonus * 1.5 + moonElementBonus * 2;

  maxLove += 32;
  maxComm += 16;
  maxChem += 12;
  maxRel  += 28;

  // Normalize to 0-100 with a baseline of 40 (no aspects = neutral, not 0)
  const normalize = (raw: number, max: number): number => {
    if (max === 0) return 50;
    // Map from [-max, +max] to [15, 98]
    const ratio = (raw + max) / (2 * max); // 0 to 1
    const score = 15 + ratio * 83;
    return Math.max(15, Math.min(98, Math.round(score)));
  };

  const love = normalize(rawLove, maxLove);
  const communication = normalize(rawComm, maxComm);
  const chemistry = normalize(rawChem, maxChem);
  const relationship = normalize(rawRel, maxRel);
  const overall = Math.round((love + communication + chemistry + relationship) / 4);

  return {
    love,
    communication,
    chemistry,
    relationship,
    overall,
    interAspects,
  };
}

