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
    const cx = 150, cy = 150, r = 120;
    const signLabels = SIGNS.map((sign, i) => {
      const midAngle = ((i + 0.5) * 30 - 90) * Math.PI / 180;
      const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
      const midRotatedAngle = ((i - signIndex + 0.5) * 30 - 90) * Math.PI / 180;
      const x2 = cx + (r - 20) * Math.cos(midRotatedAngle);
      const y2 = cy + (r - 20) * Math.sin(midRotatedAngle);
      return { sign, x2, y2 };
    });

    return (
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r - 20} fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={80} fill="rgba(13,13,43,0.8)" stroke="rgba(124,58,237,0.2)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={40} fill="rgba(13,13,43,0.6)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />

        {Array.from({ length: 12 }, (_, i) => {
          const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
          const angle = ((i - signIndex) * 30 - 90) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={cx + 60 * Math.cos(angle)}
              y1={cy + 60 * Math.sin(angle)}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="rgba(124,58,237,0.25)"
              strokeWidth="0.5"
            />
          );
        })}

        {signLabels.map(({ sign, x2, y2 }, i) => (
          <foreignObject key={i} x={x2 - 8} y={y2 - 8} width={16} height={16}>
            <AstroIcon name={SIGNS_EN_MAP[sign] || 'aries'} className="w-4 h-4 text-purple-300 opacity-60" />
          </foreignObject>
        ))}

        {(chart.aspects || []).slice(0, 15).map((aspect: any, i: number) => {
          const p1 = chart.planets?.[aspect.planet1];
          const p2 = chart.planets?.[aspect.planet2];
          if (!p1 || !p2) return null;
          const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
          const lon1 = (SIGNS.indexOf(p1.sign || 'Áries') * 30 + (p1.degree || 0) - signIndex * 30 - 90) * Math.PI / 180;
          const lon2 = (SIGNS.indexOf(p2.sign || 'Áries') * 30 + (p2.degree || 0) - signIndex * 30 - 90) * Math.PI / 180;
          const x1 = cx + 70 * Math.cos(lon1);
          const y1 = cy + 70 * Math.sin(lon1);
          const x2 = cx + 70 * Math.cos(lon2);
          const y2 = cy + 70 * Math.sin(lon2);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ASPECT_COLORS[aspect.type] || '#ffffff'}
              strokeWidth="0.4" opacity="0.4" />
          );
        })}

        {Object.entries(chart.planets || {}).map(([key, planet]: any) => {
          const signIndex = SIGNS.indexOf(chart.sun_sign || 'Áries');
          const angle = (SIGNS.indexOf(planet.sign) * 30 + planet.degree - signIndex * 30 - 90) * Math.PI / 180;
          const pr = 65;
          const px = cx + pr * Math.cos(angle);
          const py = cy + pr * Math.sin(angle);
          return (
            <foreignObject key={key} x={px - 7} y={py - 7} width={14} height={14}>
              <AstroIcon name={key} className="w-3 h-3 text-purple-300" />
            </foreignObject>
          );
        })}

        <circle cx={cx} cy={cy} r={4} fill="#D4AF37" opacity="0.8" />
      </svg>
    );
  };

  return (
    <AppLayout>
      <div className="py-6">
        <h1 className="font-serif text-3xl text-cosmic-star mb-1">🗺️ Meu Mapa Astral</h1>
        <p className="text-cosmic-muted text-sm mb-6">
          {chart.sun_sign && `☀️ ${chart.sun_sign}`}
          {chart.moon_sign && ` · 🌙 ${chart.moon_sign}`}
          {chart.ascendant && ` · ⬆️ ${chart.ascendant}`}
        </p>

        <div className="glass-card p-4 mb-6">
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
