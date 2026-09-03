import * as Astronomy from 'astronomy-engine';
import { SIGNS, PLANET_NAMES } from './astrology';

// ============================================================
// TRANSIT CALCULATION ENGINE
// Computes aspects between today's sky and the user's natal chart
// Uses astronomy-engine for NASA-level precision (same as natal chart)
// ============================================================

const TRANSIT_ASPECT_TYPES = [
  { name: 'conjunction', angle: 0, orb: 3, symbol: '☌' },
  { name: 'opposition', angle: 180, orb: 3, symbol: '☍' },
  { name: 'trine', angle: 120, orb: 3, symbol: '△' },
  { name: 'square', angle: 90, orb: 3, symbol: '□' },
  { name: 'sextile', angle: 60, orb: 2, symbol: '⚹' },
];

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  type: string;
  orb: number;
  symbol: string;
  meaning: string;
  category: 'love' | 'money' | 'emotions' | 'energy' | 'general';
}

// ============================================================
// PROFESSIONAL KNOWLEDGE BASE (RAG)
// Professional astrological meanings — the AI MUST use these
// as its technical foundation, not invent its own.
// ============================================================
export const TRANSIT_KNOWLEDGE_BASE: Record<string, { meaning: string; category: TransitAspect['category'] }> = {
  // ---- LUA (diária, emocional) ----
  'moon_conjunction_sun': {
    meaning: 'União de emoção e vontade. Dia de início de ciclo emocional, introspecção e autoconsciência.',
    category: 'emotions',
  },
  'moon_square_sun': {
    meaning: 'Tensão entre necessidades emocionais e impulsos do ego. Cuidado com reações automáticas.',
    category: 'emotions',
  },
  'moon_conjunction_moon': {
    meaning: 'Retorno lunar. Alinhamento emocional profundo, intuição aflorada, sensibilidade elevada.',
    category: 'emotions',
  },
  'moon_square_moon': {
    meaning: 'Oscilações emocionais, falta de paz interior. Evite decisões importantes sob pressão sentimental.',
    category: 'emotions',
  },
  'moon_conjunction_venus': {
    meaning: 'Excelente dia para afeto, autocuidado, beleza e harmonia emocional. Magnetismo em alta.',
    category: 'love',
  },
  'moon_trine_venus': {
    meaning: 'Fluxo harmonioso para o amor e afeto. Sensação de ser querido(a), paz nos relacionamentos.',
    category: 'love',
  },
  'moon_square_venus': {
    meaning: 'Carência temporária, dificuldade em alinhar o que se sente com o que se valoriza. Autocompaixão é fundamental.',
    category: 'love',
  },
  'moon_opposition_venus': {
    meaning: 'Desequilíbrio entre dar e receber amor. Tendência a ceder demais ou exigir demais nos relacionamentos.',
    category: 'love',
  },
  'moon_conjunction_mars': {
    meaning: 'Emoções inflamadas, coragem impulsiva ou ansiedade momentânea. Energia alta, mas pavio curto.',
    category: 'energy',
  },
  'moon_opposition_mars': {
    meaning: 'Irritabilidade emocional, reações defensivas. Pause antes de responder em conflitos.',
    category: 'emotions',
  },
  'moon_square_mars': {
    meaning: 'Frustração emocional intensa. Risco de discussões desnecessárias. Direcione a energia para atividade física.',
    category: 'emotions',
  },
  'moon_conjunction_jupiter': {
    meaning: 'Otimismo emocional, generosidade e boa sorte afetiva. Ótimo dia para conexões e expansão.',
    category: 'love',
  },
  'moon_trine_jupiter': {
    meaning: 'Bem-estar emocional e abundância. Dia propício para expandir relações sociais e sentir gratidão.',
    category: 'emotions',
  },
  'moon_conjunction_saturn': {
    meaning: 'Seriedade emocional, melancolia possível. Dia para responsabilidades e reflexão profunda.',
    category: 'emotions',
  },
  'moon_square_saturn': {
    meaning: 'Bloqueio emocional, sensação de frieza ou distância. Cuide-se com mais autocompaixão hoje.',
    category: 'emotions',
  },
  // ---- MERCÚRIO (comunicação, mente) ----
  'mercury_conjunction_mercury': {
    meaning: 'Mente afiada, clareza máxima de pensamento. Ótimo para contratos, estudos e comunicação.',
    category: 'general',
  },
  'mercury_trine_mercury': {
    meaning: 'Fluência mental e comunicativa. Ideias surgem com facilidade. Bom dia para escrever e negociar.',
    category: 'general',
  },
  'mercury_square_neptune': {
    meaning: 'Nebulosidade mental, esquecimentos, comunicação confusa. Evite assinar documentos importantes hoje.',
    category: 'general',
  },
  'mercury_conjunction_venus': {
    meaning: 'Comunicação amorosa, palavras doces. Bom para declarações, cartas e conversas difíceis com carinho.',
    category: 'love',
  },
  'mercury_square_mars': {
    meaning: 'Mente acelerada e debates acalorados. Cuidado com comunicação agressiva ou decisões precipitadas.',
    category: 'energy',
  },
  // ---- VÊNUS (amor, dinheiro, beleza) ----
  'venus_conjunction_venus': {
    meaning: 'Retorno de Vênus. Renovação de valores afetivos e financeiros. Magnetismo pessoal em alta.',
    category: 'love',
  },
  'venus_trine_venus': {
    meaning: 'Harmonia afetiva e financeira. Dia favorável para cuidar das finanças e do amor com leveza.',
    category: 'love',
  },
  'venus_trine_sun': {
    meaning: 'Charme natural e bem-estar. Bom para socializar, criar e expressar sua beleza interior.',
    category: 'love',
  },
  'venus_conjunction_mars': {
    meaning: 'Forte atração e magnetismo romântico. Dia de química intensa, paixão e expressão do desejo.',
    category: 'love',
  },
  'venus_trine_mars': {
    meaning: 'Química fluindo bem, motivação saudável. Ótimo para tomar iniciativa no amor.',
    category: 'love',
  },
  'venus_square_saturn': {
    meaning: 'Restrições financeiras ou afetivas, sensação de frieza ou solidão temporária no amor.',
    category: 'money',
  },
  'venus_opposition_saturn': {
    meaning: 'Tensão entre liberdade e compromisso. Testes nas relações que pedem maturidade.',
    category: 'love',
  },
  'venus_conjunction_jupiter': {
    meaning: 'Período de abundância afetiva e financeira. Sorte e expansão em tudo que envolve prazer e recursos.',
    category: 'money',
  },
  // ---- MARTE (energia, ação, ambição) ----
  'mars_conjunction_sun': {
    meaning: 'Pico de energia e coragem. Dia para agir com força, mas cuidado com impulsividade e conflitos.',
    category: 'energy',
  },
  'mars_trine_sun': {
    meaning: 'Energia vibrante e produtiva. Ótimo dia para exercitar, liderar e colocar planos em ação.',
    category: 'energy',
  },
  'mars_square_sun': {
    meaning: 'Frustração e atrito. Energia pode vir de forma agressiva. Redirecione para esporte ou trabalho físico.',
    category: 'energy',
  },
  'mars_conjunction_mars': {
    meaning: 'Retorno de Marte. Recomeço de ciclo de ação e energia. Alta impulsividade e determinação.',
    category: 'energy',
  },
  'mars_trine_jupiter': {
    meaning: 'Expansão e ação alinhadas. Dia de grande produtividade, ambição saudável e conquistas reais.',
    category: 'money',
  },
  'mars_square_saturn': {
    meaning: 'Bloqueio de energia, frustração e obstáculos. A persistência disciplinada vence hoje.',
    category: 'energy',
  },
  // ---- JÚPITER (expansão, sorte, dinheiro) ----
  'jupiter_conjunction_sun': {
    meaning: 'Fase de grande expansão e confiança. Oportunidades importantes surgindo na carreira e vida pessoal.',
    category: 'money',
  },
  'jupiter_trine_sun': {
    meaning: 'Fluxo de boa sorte e crescimento natural. Aproveite para investir, estudar e expandir horizontes.',
    category: 'money',
  },
  'jupiter_square_sun': {
    meaning: 'Excesso e exagero. Cuidado com gastos desnecessários ou promessas que não conseguirá cumprir.',
    category: 'money',
  },
  // ---- SATURNO (lições, estrutura, limites) ----
  'saturn_conjunction_sun': {
    meaning: 'Grande lição de vida. Período de responsabilidade, maturidade forçada e construção de estruturas sólidas.',
    category: 'general',
  },
  'saturn_square_sun': {
    meaning: 'Teste de força de vontade. Obstáculos exigem disciplina. O que não servir mais cai.',
    category: 'general',
  },
  'saturn_trine_sun': {
    meaning: 'Disciplina fluindo bem. Bom momento para consolidar projetos e construir algo que dure.',
    category: 'money',
  },
};

// Get professional meaning from knowledge base
function getTransitMeaning(
  transitPlanet: string,
  natalPlanet: string,
  aspectType: string
): { meaning: string; category: TransitAspect['category'] } {
  const key = `${transitPlanet}_${aspectType}_${natalPlanet}`;
  if (TRANSIT_KNOWLEDGE_BASE[key]) {
    return TRANSIT_KNOWLEDGE_BASE[key];
  }
  // Try reverse
  const reverseKey = `${natalPlanet}_${aspectType}_${transitPlanet}`;
  if (TRANSIT_KNOWLEDGE_BASE[reverseKey]) {
    return TRANSIT_KNOWLEDGE_BASE[reverseKey];
  }

  // Default by aspect type
  const isHarmonious = aspectType === 'conjunction' || aspectType === 'trine' || aspectType === 'sextile';
  return {
    meaning: isHarmonious
      ? 'Energia fluida e benéfica que facilita o andamento natural da vida.'
      : 'Momento de desafio e atrito que exige ajuste, consciência e crescimento.',
    category: 'general',
  };
}

// Get ecliptic longitude of a planet on a given date using astronomy-engine
function getPlanetLongitudeToday(body: Astronomy.Body, date: Date): number {
  const time = Astronomy.MakeTime(date);
  if (body === Astronomy.Body.Sun) {
    const sunPos = Astronomy.SunPosition(time);
    return ((sunPos.elon % 360) + 360) % 360;
  }
  const geoVector = Astronomy.GeoVector(body, time, true);
  const ecliptic = Astronomy.Ecliptic(geoVector);
  return ((ecliptic.elon % 360) + 360) % 360;
}

// Convert sign + degree to absolute ecliptic longitude
function toAbsLongitude(sign: string | undefined, degree: number | undefined): number | null {
  if (!sign) return null;
  const signIdx = SIGNS.indexOf(sign);
  if (signIdx === -1) return null;
  return signIdx * 30 + (degree || 0);
}

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

// ============================================================
// MAIN FUNCTION: calculate daily transits for a natal chart
// ============================================================
export function calculateDailyTransits(natalChart: any, targetDate = new Date()): TransitAspect[] {
  if (!natalChart) return [];

  const transits: TransitAspect[] = [];

  // Compute transit (today's sky) positions
  const transitPositions: Record<string, number> = {};
  for (const [key, body] of Object.entries(BODY_MAP)) {
    try {
      transitPositions[key] = getPlanetLongitudeToday(body, targetDate);
    } catch {
      // skip if error
    }
  }

  // Build natal planet positions from the chart
  // Chart can come in two formats: { planets: { sun: { sign, degree } } } or flat { sun_sign, sun_degree }
  const natalPositions: Record<string, number> = {};

  // From planets object
  if (natalChart.planets && typeof natalChart.planets === 'object') {
    for (const [key, planet] of Object.entries(natalChart.planets) as any) {
      const sign = planet?.sign || planet?.signo;
      const degree = planet?.degree ?? planet?.grau ?? 0;
      const lon = toAbsLongitude(sign, degree);
      if (lon !== null) natalPositions[key] = lon;
    }
  }

  // Also add Sun and Moon from flat fields (handle both shapes)
  if (natalChart.sun_sign) {
    natalPositions['sun'] = toAbsLongitude(natalChart.sun_sign, natalChart.sun_degree) ?? natalPositions['sun'] ?? 0;
  }
  if (natalChart.moon_sign) {
    natalPositions['moon'] = toAbsLongitude(natalChart.moon_sign, natalChart.moon_degree) ?? natalPositions['moon'] ?? 0;
  }
  if (natalChart.venus_sign) {
    natalPositions['venus'] = toAbsLongitude(natalChart.venus_sign, 0) ?? natalPositions['venus'] ?? 0;
  }

  // Calculate aspects between transit and natal positions
  for (const [tKey, tLon] of Object.entries(transitPositions)) {
    for (const [nKey, nLon] of Object.entries(natalPositions)) {
      let diff = Math.abs(tLon - nLon);
      if (diff > 180) diff = 360 - diff;

      for (const aspect of TRANSIT_ASPECT_TYPES) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          const { meaning, category } = getTransitMeaning(tKey, nKey, aspect.name);
          transits.push({
            transitPlanet: tKey,
            natalPlanet: nKey,
            type: aspect.name,
            orb: Math.round(orb * 10) / 10,
            symbol: aspect.symbol,
            meaning,
            category,
          });
          break;
        }
      }
    }
  }

  // Sort by orb tightness (closest aspects first = most important)
  transits.sort((a, b) => a.orb - b.orb);

  return transits;
}

// Get the most important transits per category for the horoscope prompt
export function getTopTransitsByCategory(
  transits: TransitAspect[]
): Record<TransitAspect['category'], TransitAspect[]> {
  const byCategory: Record<TransitAspect['category'], TransitAspect[]> = {
    love: [],
    money: [],
    emotions: [],
    energy: [],
    general: [],
  };

  for (const transit of transits) {
    byCategory[transit.category].push(transit);
  }

  return byCategory;
}

// Format a transit as a readable line for the AI prompt
export function formatTransitForPrompt(t: TransitAspect): string {
  const tName = PLANET_NAMES[t.transitPlanet] || t.transitPlanet;
  const nName = PLANET_NAMES[t.natalPlanet] || t.natalPlanet;
  return `${tName} em trânsito ${t.symbol} ${nName} natal (orbe ${t.orb}°)\n  → Regra técnica: ${t.meaning}`;
}
