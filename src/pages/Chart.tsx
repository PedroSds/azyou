import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { PLANET_NAMES, PLANET_SYMBOLS, SIGN_SYMBOLS, SIGNS } from '../services/astrology';
import { HOUSE_INFO, SIGN_DESCRIPTIONS } from '../data/astroData';
import { getQuickAIResponse } from '../services/aiChat';
import AppLayout from '../components/layout/AppLayout';
import { AstroIcon } from '../components/ui/AstroIcons';
import type { AstroContext } from '../services/aiChat';

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#FFD700', trine: '#00FF88', sextile: '#00BFFF',
  square: '#FF4444', opposition: '#FF8800', quincunx: '#CC44FF', semisquare: '#AAAAAA'
};
const ASPECT_NAMES: Record<string, string> = {
  conjunction: 'Conjunção', opposition: 'Oposição', trine: 'Trígono',
  square: 'Quadratura', sextile: 'Sextil', quincunx: 'Quincúncio', semisquare: 'Semiquadratura',
};

const SIGNS_EN_MAP: Record<string, string> = {
  'Áries': 'aries', 'Touro': 'taurus', 'Gêmeos': 'gemini', 'Câncer': 'cancer',
  'Leão': 'leo', 'Virgem': 'virgo', 'Libra': 'libra', 'Escorpião': 'scorpio',
  'Sagitário': 'sagittarius', 'Capricórnio': 'capricorn', 'Aquário': 'aquarius', 'Peixes': 'pisces',
};

export default function ChartPage() {
  const { profile, chart } = useUserStore();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [tab, setTab] = useState<'planets' | 'houses' | 'aspects'>('planets');
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  if (!profile || !chart) return null;

  const context: AstroContext = {
    name: profile.name,
    sun: chart.sun_sign,
    sunDegree: chart.sun_degree,
    moon: chart.moon_sign,
    moonDegree: chart.moon_degree,
    ascendant: chart.ascendant,
    ascDegree: chart.asc_degree,
    midheaven: chart.midheaven,
    planets: chart.planets as any,
    aspects: chart.aspects as any,
    venusSign: chart.venus_sign,
    personalArcanum: chart.personal_arcanum,
    birthDate: profile.birth_date,
    birthCity: profile.birth_city,
    interests: profile.interests,
  };

  const getAIForPlanet = async (planetKey: string) => {
    const planet = chart.planets?.[planetKey];
    if (!planet) return;
    const planetName = PLANET_NAMES[planetKey] || planetKey;
    setModalTitle(`${PLANET_SYMBOLS[planetKey] || ''} ${planetName} em ${planet.sign}`);
    setShowModal(true);
    setAiInterpretation('');
    setLoadingAI(true);

    const prompt = `Explique em detalhes o significado de ${planetName} em ${planet.sign}${planet.house ? `, na Casa ${planet.house}` : ''}${planet.retrograde ? ' (retrógrado)' : ''} no mapa de ${profile.name}.
    
Inclua:
1. Como essa posição se manifesta na personalidade
2. Desafios e dons dessa posição
3. Como ${profile.name} pode trabalhar com essa energia

Seja caloroso(a), específico(a) e profundo(a). 3 parágrafos.`;

    const response = await getQuickAIResponse(prompt, context);
    setAiInterpretation(response);
    setLoadingAI(false);
  };

  const getAIForHouse = async (houseNum: number) => {
    const house = chart.houses?.[houseNum.toString()];
    const houseInfo = HOUSE_INFO[houseNum];
    if (!house || !houseInfo) return;

    setModalTitle(`${houseInfo.emoji} ${houseInfo.name} — ${houseInfo.theme}`);
    setShowModal(true);
    setAiInterpretation('');
    setLoadingAI(true);

    const planetsInHouse = Object.entries(chart.planets || {})
      .filter(([_, p]: any) => p.house === houseNum)
      .map(([k]) => PLANET_NAMES[k] || k);

    const prompt = `Explique a Casa ${houseNum} no mapa de ${profile.name}.

A Casa ${houseNum} tem ${house.sign} na cúspide${planetsInHouse.length ? ` e contém ${planetsInHouse.join(', ')}` : ' e não possui planetas'}.

Explique:
1. O que a Casa ${houseNum} representa (${houseInfo.theme})
2. Como ${house.sign} na cúspide influencia essa área da vida
${planetsInHouse.length ? `3. O impacto de ${planetsInHouse.join(' e ')} nessa casa` : ''}

Seja específico(a) para ${profile.name} e pratique. 2-3 parágrafos.`;

    const response = await getQuickAIResponse(prompt, context);
    setAiInterpretation(response);
    setLoadingAI(false);
  };

  // SVG Birth Chart
  const ChartSVG = () => {
    const cx = 200, cy = 200, r = 180;
    const signLabels = SIGNS.map((sign, i) => {
      const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
      const midRotatedAngle = ((i - signIndex + 0.5) * 30 - 90) * Math.PI / 180;
      const x2 = cx + (r - 15) * Math.cos(midRotatedAngle);
      const y2 = cy + (r - 15) * Math.sin(midRotatedAngle);
      return { sign, x2, y2 };
    });

    const planetsList = Object.entries(chart.planets || {}).map(([key, planet]: any) => {
      const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
      const angleDeg = (SIGNS.indexOf(planet.sign) * 30 + planet.degree - signIndex * 30 - 90);
      return { key, planet, angleDeg };
    }).sort((a, b) => a.angleDeg - b.angleDeg);

    const planetsPositions = planetsList.map((p, i, arr) => {
      let collisionCount = 0;
      for (let j = i - 1; j >= 0; j--) {
        const prev = arr[j];
        if (p.angleDeg - prev.angleDeg < 12) {
           collisionCount++;
        } else {
           break;
        }
      }
      const pR = 135 - (collisionCount * 22);
      const angleRad = p.angleDeg * Math.PI / 180;
      return {
        key: p.key,
        px: cx + pR * Math.cos(angleRad),
        py: cy + pR * Math.sin(angleRad),
      };
    });

    return (
      <svg viewBox="0 0 400 400" className="w-full max-w-[400px] mx-auto filter drop-shadow-sm">
        <circle cx={cx} cy={cy} r={r} fill="#FAFAFA" stroke="#B39EB5" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 30} fill="none" stroke="#B39EB5" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={110} fill="#F3F0F5" stroke="#B39EB5" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={50} fill="#EAE5ED" stroke="#B39EB5" strokeWidth="1" />

        {Array.from({ length: 12 }, (_, i) => {
          const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
          const angle = ((i - signIndex) * 30 - 90) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={cx + 80 * Math.cos(angle)}
              y1={cy + 80 * Math.sin(angle)}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="#B39EB5"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {signLabels.map(({ sign, x2, y2 }, i) => (
          <foreignObject key={i} x={x2 - 10} y={y2 - 10} width={20} height={20}>
            <AstroIcon name={SIGNS_EN_MAP[sign] || 'aries'} className="w-5 h-5 text-[#B39EB5]" />
          </foreignObject>
        ))}

        {(chart.aspects || []).slice(0, 15).map((aspect: any, i: number) => {
          const p1 = chart.planets?.[aspect.planet1];
          const p2 = chart.planets?.[aspect.planet2];
          if (!p1 || !p2) return null;
          const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
          const lon1 = (SIGNS.indexOf(p1.sign || 'Áries') * 30 + (p1.degree || 0) - signIndex * 30 - 90) * Math.PI / 180;
          const lon2 = (SIGNS.indexOf(p2.sign || 'Áries') * 30 + (p2.degree || 0) - signIndex * 30 - 90) * Math.PI / 180;
          const x1 = cx + 100 * Math.cos(lon1);
          const y1 = cy + 100 * Math.sin(lon1);
          const x2 = cx + 100 * Math.cos(lon2);
          const y2 = cy + 100 * Math.sin(lon2);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ASPECT_COLORS[aspect.type] || '#B39EB5'}
              strokeWidth="1.2" opacity="0.8" />
          );
        })}

        {planetsPositions.map(({ key, px, py }) => (
          <foreignObject key={key} x={px - 9} y={py - 9} width={18} height={18}>
            <div className="w-full h-full flex items-center justify-center rounded-full bg-[#B39EB5] border border-white shadow-sm">
               <AstroIcon name={key} className="w-4 h-4 text-white" />
            </div>
          </foreignObject>
        ))}

        <circle cx={cx} cy={cy} r={6} fill="#000000" opacity="0.8" />
      </svg>
    );
  };

  return (
    <AppLayout>
      <div className="py-6">
        <div className="flex items-center gap-4 text-cosmic-star text-sm mb-6 font-medium bg-white border border-[#B39EB5]/30 rounded-full py-2 px-4 w-max shadow-sm">
          {chart.sun_sign && (
             <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full bg-[#B39EB5]/20 flex items-center justify-center">
                 <AstroIcon name="sun" className="w-3.5 h-3.5 text-[#B39EB5]" />
               </div>
               {chart.sun_sign}
             </div>
          )}
          {chart.moon_sign && (
             <>
               <span className="text-[#B39EB5] opacity-50">|</span>
               <div className="flex items-center gap-1.5">
                 <div className="w-5 h-5 rounded-full bg-[#B39EB5]/20 flex items-center justify-center">
                   <AstroIcon name="moon" className="w-3.5 h-3.5 text-[#B39EB5]" />
                 </div>
                 {chart.moon_sign}
               </div>
             </>
          )}
          {chart.ascendant && (
             <>
               <span className="text-[#B39EB5] opacity-50">|</span>
               <div className="flex items-center gap-1.5">
                 <div className="w-5 h-5 rounded-full bg-[#B39EB5]/20 flex items-center justify-center">
                   <AstroIcon name="ascendant" className="w-3.5 h-3.5 text-[#B39EB5]" />
                 </div>
                 {chart.ascendant}
               </div>
             </>
          )}
        </div>

        <div className="glass-card p-6 mb-6">
          <ChartSVG />
        </div>

        <div className="flex mb-4 w-full">
          <div className="glass-card flex w-full p-1 rounded-full border-cosmic-border">
            {[
              { id: 'planets', label: '🪐 Planetas' },
              { id: 'houses', label: '🏠 Casas' },
              { id: 'aspects', label: '✨ Aspectos' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 relative py-2 text-xs rounded-full transition-all duration-200 whitespace-nowrap text-center ${
                  tab === t.id
                    ? 'text-cosmic-star font-semibold'
                    : 'text-cosmic-muted font-medium hover:text-cosmic-star'
                }`}
              >
                {tab === t.id && (
                  <motion.div
                    layoutId="chartTabIndicator"
                    className="absolute inset-0 bg-cosmic-accent/20 border border-cosmic-accent/40 rounded-full"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {tab === 'planets' && (
              <div className="space-y-2">
                {Object.entries(chart.planets || {}).map(([key, planet]: any) => {
                  const name = PLANET_NAMES[key] || key;
                  const signInfo = SIGN_DESCRIPTIONS[planet.sign];
                  return (
                    <div
                      key={key}
                      className="w-full glass-card p-4 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-cosmic-star border border-cosmic-accent/30 shadow-glow">
                        <AstroIcon name={key} className="w-4 h-4" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-cosmic-star text-sm font-medium">{name}</p>
                        <p className="text-cosmic-muted text-xs">{planet.sign} {planet.house ? `· Casa ${planet.house}` : ''} {planet.retrograde ? '· ℞' : ''}</p>
                      </div>
                      {signInfo && (
                        <span className={`text-xs px-2 py-0.5 rounded-full`} style={{ background: `${signInfo.color}25`, color: signInfo.color }}>
                          {signInfo.element}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'houses' && (
              <div className="space-y-2">
                {Object.entries(chart.houses || {}).map(([num, house]: any) => {
                  const houseNum = parseInt(num);
                  const info = HOUSE_INFO[houseNum];
                  if (!info) return null;
                  const planetsInHouse = Object.entries(chart.planets || {})
                    .filter(([_, p]: any) => p.house === houseNum)
                    .map(([k]) => ({ key: k, name: PLANET_NAMES[k] }));

                  return (
                    <div
                      key={num}
                      className="w-full glass-card p-4 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-cosmic-star border border-cosmic-accent/30 shadow-glow">
                        <AstroIcon name={SIGNS_EN_MAP[house.sign] || 'aries'} className="w-4 h-4 opacity-70" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-cosmic-star text-sm font-medium">{info.name} — {info.theme}</p>
                        <p className="text-cosmic-muted text-xs">{house.sign} {planetsInHouse.length > 0 ? `· ${planetsInHouse.map(p => p.name).join(', ')}` : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'aspects' && (
              <div className="space-y-2">
                {(chart.aspects || []).map((aspect: any, i: number) => {
                  const p1Name = PLANET_NAMES[aspect.planet1] || aspect.planet1;
                  const p2Name = PLANET_NAMES[aspect.planet2] || aspect.planet2;
                  return (
                    <div key={i} className="glass-card p-3 flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center text-cosmic-star" style={{ color: ASPECT_COLORS[aspect.type] }}>
                         <AstroIcon name="aspect" className="w-5 h-5 opacity-70" />
                      </div>
                      <div className="flex-1">
                        <p className="text-cosmic-star text-sm">
                          {p1Name} — {p2Name}
                        </p>
                        <p className="text-cosmic-muted text-xs">
                          {ASPECT_NAMES[aspect.type] || aspect.type} · {aspect.orb}° orbe
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!chart.aspects || chart.aspects.length === 0) && (
                  <p className="text-cosmic-muted text-sm text-center py-8">Nenhum aspecto calculado</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-lg bg-cosmic-card border border-cosmic-border rounded-3xl p-6 max-h-[80vh] overflow-y-auto shadow-xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-cosmic-muted hover:text-cosmic-purple">
                <X size={20} />
              </button>
              <h3 className="font-serif text-xl text-cosmic-star mb-4 pr-8">{modalTitle}</h3>
              {loadingAI ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/6" />
                  <p className="text-cosmic-star text-xs text-center mt-4 animate-pulse">Azy está interpretando seu mapa...</p>
                </div>
              ) : (
                <p className="text-cosmic-text text-sm leading-relaxed whitespace-pre-wrap">{aiInterpretation}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
