import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookmarkPlus, Zap, Check, X, User, Calendar, Clock, MapPin,
  ChevronDown, ChevronUp, Trash2, Plus, Sparkles
} from 'lucide-react';
import { calculateBirthChart, initAstrology } from '../../services/astrology';
import { getMoonPhase, PLANET_NAMES, SIGNS } from '../../services/astrology';
import { AstroIcon } from '../ui/AstroIcons';
import { HOUSE_INFO, SIGN_DESCRIPTIONS } from '../../data/astroData';
import { searchCities, type CityResult } from '../../services/geocoding';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../stores/userStore';

export interface SavedMap {
  id?: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_city?: string;
  birth_lat?: number;
  birth_lon?: number;
  chart?: any;
}

interface MapCreatorProps {
  onMapCreated?: (map: SavedMap) => void;
  onMapsChanged?: () => void;
}

const SIGNS_EN_MAP: Record<string, string> = {
  'Áries': 'aries', 'Touro': 'taurus', 'Gêmeos': 'gemini', 'Câncer': 'cancer',
  'Leão': 'leo', 'Virgem': 'virgo', 'Libra': 'libra', 'Escorpião': 'scorpio',
  'Sagitário': 'sagittarius', 'Capricórnio': 'capricorn', 'Aquário': 'aquarius', 'Peixes': 'pisces',
};

const PLANET_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#FFD700', trine: '#00FF88', sextile: '#00BFFF',
  square: '#FF4444', opposition: '#FF8800', quincunx: '#CC44FF',
};
const ASPECT_NAMES: Record<string, string> = {
  conjunction: 'Conjunção', opposition: 'Oposição', trine: 'Trígono',
  square: 'Quadratura', sextile: 'Sextil', quincunx: 'Quincúncio', semisquare: 'Semiquadratura',
};

// ─── Saved Map Detail Card ───
function MapDetailView({ chart, name }: { chart: any; name: string }) {
  const [detailTab, setDetailTab] = useState<'planets' | 'houses' | 'aspects'>('planets');

  if (!chart) return <p className="text-cosmic-muted text-xs py-2">Mapa não disponível</p>;

  // Normalize chart data (handles both CalculatedChart and flat stored format)
  const planets = chart.planets || {};
  const houses = chart.houses || {};
  const aspects = chart.aspects || [];
  const sunSign = chart.sun?.sign || chart.sun_sign || '';
  const moonSign = chart.moon?.sign || chart.moon_sign || '';
  const ascSign = chart.ascendant?.sign || chart.ascendant || '';

  return (
    <div className="mt-3">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs text-cosmic-muted mb-3 flex-wrap">
        {sunSign && <span>☀️ {sunSign}</span>}
        {moonSign && <span>🌙 {moonSign}</span>}
        {ascSign && <span>⬆️ {ascSign}</span>}
      </div>

      {/* Sub-tabs */}
      <div className="flex mb-3 w-full">
        <div className="glass-card flex w-full p-0.5 rounded-full border-cosmic-border">
          {[
            { id: 'planets', label: '🪐 Planetas' },
            { id: 'houses', label: '🏠 Casas' },
            { id: 'aspects', label: '✨ Aspectos' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={(e) => { e.stopPropagation(); setDetailTab(t.id as any); }}
              className={`flex-1 relative py-1.5 text-[11px] rounded-full transition-all duration-200 whitespace-nowrap text-center ${
                detailTab === t.id
                  ? 'text-cosmic-star font-semibold'
                  : 'text-cosmic-muted font-medium hover:text-cosmic-star'
              }`}
            >
              {detailTab === t.id && (
                <motion.div
                  layoutId={`mapDetail-${name}`}
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
          key={detailTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* Planets */}
          {detailTab === 'planets' && (
            <div className="space-y-1">
              {Object.entries(planets).map(([key, planet]: any) => {
                const pName = PLANET_NAMES[key] || key;
                const signInfo = SIGN_DESCRIPTIONS[planet.sign];
                return (
                  <div key={key} className="glass-card p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-cosmic-star border border-cosmic-accent/30 shadow-glow">
                      <AstroIcon name={key} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cosmic-star text-xs font-medium">{pName}</p>
                      <p className="text-cosmic-muted text-[11px]">
                        {planet.sign} {planet.degree !== undefined ? `${Number(planet.degree).toFixed(1)}°` : ''}
                        {planet.house ? ` · Casa ${planet.house}` : ''}
                        {planet.retrograde ? ' · ℞' : ''}
                      </p>
                    </div>
                    {signInfo && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: `${signInfo.color}25`, color: signInfo.color }}
                      >
                        {signInfo.element}
                      </span>
                    )}
                  </div>
                );
              })}
              {Object.keys(planets).length === 0 && (
                <p className="text-cosmic-muted text-xs text-center py-4">Nenhum planeta calculado</p>
              )}
            </div>
          )}

          {/* Houses */}
          {detailTab === 'houses' && (
            <div className="space-y-1">
              {Object.entries(houses).map(([num, house]: any) => {
                const houseNum = parseInt(num);
                const info = HOUSE_INFO[houseNum];
                if (!info) return null;
                const planetsInHouse = Object.entries(planets)
                  .filter(([_, p]: any) => p.house === houseNum)
                  .map(([k]) => PLANET_NAMES[k] || k);

                return (
                  <div key={num} className="glass-card p-3 flex items-center gap-2.5">
                    <div className="w-6 h-6 flex items-center justify-center text-cosmic-star">
                      <AstroIcon name={SIGNS_EN_MAP[house.sign] || 'aries'} className="w-4 h-4 opacity-70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cosmic-star text-xs font-medium">{info.name} — {info.theme}</p>
                      <div className="text-cosmic-muted text-[11px] mt-0.5">
                        <span>Cúspide em {house.sign}</span>
                        {planetsInHouse.length > 0 && (
                          <span className="block text-cosmic-text mt-0.5">
                            Planetas aqui: <span className="text-cosmic-star">{planetsInHouse.join(', ')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(houses).length === 0 && (
                <p className="text-cosmic-muted text-xs text-center py-4">Casas não calculadas (hora desconhecida)</p>
              )}
            </div>
          )}

          {/* Aspects */}
          {detailTab === 'aspects' && (
            <div className="space-y-1">
              {aspects.map((aspect: any, i: number) => {
                const p1 = PLANET_NAMES[aspect.planet1] || aspect.planet1;
                const p2 = PLANET_NAMES[aspect.planet2] || aspect.planet2;
                return (
                  <div key={i} className="glass-card p-3 flex items-center gap-2.5">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <AstroIcon name={aspect.type} className="w-4 h-4" style={{ color: ASPECT_COLORS[aspect.type] || '#fff' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-cosmic-star text-xs">{p1} — {p2}</p>
                      <p className="text-cosmic-muted text-[11px]">
                        {ASPECT_NAMES[aspect.type] || aspect.type} · {aspect.orb}° orbe
                      </p>
                    </div>
                  </div>
                );
              })}
              {aspects.length === 0 && (
                <p className="text-cosmic-muted text-xs text-center py-4">Nenhum aspecto calculado</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Born Chart Wheel (SVG) ───
function ChartWheel({ chart }: { chart: any }) {
  const cx = 200, cy = 200, r = 180;
  const planets = chart?.planets || {};
  const signIndex = SIGNS.indexOf(chart?.sun_sign || 'Áries');

  const signLabels = SIGNS.map((sign, i) => {
    const midRotatedAngle = ((i - signIndex + 0.5) * 30 - 90) * Math.PI / 180;
    return {
      sign,
      x2: cx + (r - 15) * Math.cos(midRotatedAngle),
      y2: cy + (r - 15) * Math.sin(midRotatedAngle),
    };
  });

  const planetsList = Object.entries(planets).map(([key, planet]: any) => {
    const pSignIndex = SIGNS.indexOf(planet.sign);
    const angleDeg = (pSignIndex * 30 + (planet.degree || 0) - signIndex * 30 - 90);
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

        {(chart?.aspects || []).slice(0, 15).map((aspect: any, i: number) => {
          const p1 = planets[aspect.planet1];
          const p2 = planets[aspect.planet2];
          if (!p1 || !p2) return null;
          const p1SignI = SIGNS.indexOf(p1.sign) === -1 ? 0 : SIGNS.indexOf(p1.sign);
          const p2SignI = SIGNS.indexOf(p2.sign) === -1 ? 0 : SIGNS.indexOf(p2.sign);
          const lon1 = (p1SignI * 30 + (p1.degree || 0) - signIndex * 30 - 90) * Math.PI / 180;
          const lon2 = (p2SignI * 30 + (p2.degree || 0) - signIndex * 30 - 90) * Math.PI / 180;
          return (
            <line key={i} x1={cx + 100 * Math.cos(lon1)} y1={cy + 100 * Math.sin(lon1)}
              x2={cx + 100 * Math.cos(lon2)} y2={cy + 100 * Math.sin(lon2)}
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
}

// ─── Main MapCreator Component ───
export default function MapCreator({ onMapsChanged }: MapCreatorProps) {
  const { user } = useUserStore() as any;

  // Sub-tab state
  const [subTab, setSubTab] = useState<'criar' | 'salvos'>('criar');

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState({ day: '', month: '', year: '' });
  const [time, setTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [city, setCity] = useState<CityResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ chart: any; meta: any } | null>(null);

  // Saved maps state
  const [savedMaps, setSavedMaps] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadSavedMaps = useCallback(async () => {
    if (!user) { setLoadingSaved(false); return; }
    setLoadingSaved(true);
    const { data } = await supabase
      .from('mapas_pessoas')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });
    setSavedMaps(data || []);
    setLoadingSaved(false);
  }, [user]);

  useEffect(() => {
    loadSavedMaps();
  }, [loadSavedMaps]);

  const searchCity = async (q: string) => {
    setCityQuery(q);
    setCity(null);
    if (q.length < 2) { setCityResults([]); return; }
    const results = await searchCities(q);
    setCityResults(results);
  };

  const isFormValid = name.trim() && date.day && date.month && date.year;

  const buildChart = () => {
    const dateStr = `${date.year}-${date.month.padStart(2, '0')}-${date.day.padStart(2, '0')}`;
    return {
      dateStr,
      chart: calculateBirthChart({
        birthDate: dateStr,
        birthTime: noTime ? undefined : time || undefined,
        lat: city?.lat || 0,
        lon: city?.lon || 0,
        timezone: city?.timezone || undefined,
      }, dateStr),
    };
  };

  const handleGenerate = async () => {
    if (!isFormValid) return;
    await initAstrology();
    const { dateStr, chart } = buildChart();
    const meta = {
      name: name.trim(),
      birth_date: dateStr,
      birth_time: noTime ? undefined : time || undefined,
      birth_city: city?.displayName || undefined,
      birth_lat: city?.lat || undefined,
      birth_lon: city?.lon || undefined,
      timezone: city?.timezone || undefined,
    };
    setGenerated({ chart, meta });
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!generated || !user) return;
    setSaving(true);
    setSaveError(null);

    const payload = {
      usuario_id: user.id,
      nome: generated.meta.name,
      data_nascimento: generated.meta.birth_date,
      hora_nascimento: generated.meta.birth_time || null,
      cidade_nascimento: generated.meta.birth_city || null,
      latitude_nascimento: generated.meta.birth_lat || null,
      longitude_nascimento: generated.meta.birth_lon || null,
      mapa_calculado: generated.chart,
    };

    const { data, error } = await supabase
      .from('mapas_pessoas')
      .insert(payload)
      .select()
      .single();

    if (error) {
      setSaveError(error.message || 'Erro ao salvar o mapa. Tente novamente.');
      setSaving(false);
      return;
    }

    if (data) {
      setSaved(true);
      onMapsChanged?.();
      await loadSavedMaps();
      setGenerated(null);
      resetForm();
      setTimeout(() => {
        setSaved(false);
        setSubTab('salvos');
      }, 1500);
    }
    setSaving(false);
  };

  const deleteMap = async (id: string) => {
    setDeleting(id);
    await supabase.from('mapas_pessoas').delete().eq('id', id);
    setSavedMaps(prev => prev.filter(m => m.id !== id));
    if (expandedMap === id) setExpandedMap(null);
    setDeleting(null);
    onMapsChanged?.();
  };

  const resetForm = () => {
    setName('');
    setDate({ day: '', month: '', year: '' });
    setTime('');
    setNoTime(false);
    setCityQuery('');
    setCityResults([]);
    setCity(null);
    setGenerated(null);
    setSaveError(null);
  };

  return (
    <div className="py-4">
      {/* Sub-tabs: Criar | Salvos */}
      <div className="flex mb-5 w-full">
        <div className="glass-card flex w-full p-1 rounded-full border-cosmic-border">
          {[
            { id: 'criar', label: '✨ Criar Mapa' },
            { id: 'salvos', label: `📋 Salvos${savedMaps.length > 0 ? ` (${savedMaps.length})` : ''}` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`flex-1 relative py-2 text-sm rounded-full transition-all duration-200 whitespace-nowrap text-center ${
                subTab === t.id
                  ? 'text-cosmic-star font-semibold'
                  : 'text-cosmic-muted font-medium hover:text-cosmic-star'
              }`}
            >
              {subTab === t.id && (
                <motion.div
                  layoutId="mapCreatorSubTab"
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
        {subTab === 'criar' ? (
          <motion.div
            key="criar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <p className="text-cosmic-muted text-sm mb-4">
              Preencha os dados para gerar o mapa astral da pessoa. Depois de criado, você pode salvá-lo para acessar depois ou usar na Sinastria.
            </p>

            <AnimatePresence mode="wait">
              {saved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="glass-card p-8 flex flex-col items-center gap-3 text-center border border-green-400/30"
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-400/20 flex items-center justify-center">
                    <Check size={28} className="text-green-500" />
                  </div>
                  <p className="font-semibold text-cosmic-star">Mapa salvo com sucesso!</p>
                  <p className="text-xs text-cosmic-muted">Você pode acessá-lo em "Salvos" e na Sinastria</p>
                </motion.div>
              ) : generated ? (
                <motion.div
                  key="generated"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <div className="glass-card p-5 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-cosmic-star font-semibold">🗺️ Mapa de {generated.meta.name}</p>
                        <p className="text-cosmic-muted text-xs">
                          {generated.chart?.sun?.sign && `☀️ ${generated.chart.sun.sign}`}
                          {generated.chart?.moon?.sign && ` · 🌙 ${generated.chart.moon.sign}`}
                          {generated.chart?.ascendant?.sign && ` · ⬆️ ${generated.chart.ascendant.sign}`}
                        </p>
                      </div>
                      <button
                        onClick={() => { setGenerated(null); }}
                        className="text-cosmic-muted hover:text-cosmic-star"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <ChartWheel chart={generated.chart} />
                  </div>

                  <MapDetailView chart={generated.chart} name={generated.meta.name} />

                  {saveError && (
                    <div className="mt-2 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2">
                      {saveError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => { setGenerated(null); setSaveError(null); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-cosmic-accent/40 text-cosmic-accent font-semibold text-sm hover:bg-cosmic-accent/10 transition-all"
                    >
                      <Zap size={15} />
                      Editar dados
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !user}
                      className="flex-1 cosmic-button flex items-center justify-center gap-2 text-sm disabled:opacity-40"
                    >
                      {saving
                        ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        : <BookmarkPlus size={15} />
                      }
                      {saving ? 'Salvando...' : 'Salvar mapa'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="glass-card p-5 space-y-4"
                >
                  {/* Nome */}
                  <div>
                    <label className="text-xs text-cosmic-muted font-medium mb-1 flex items-center gap-1 block">
                      <User size={11} /> Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Nome da pessoa"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="input-cosmic"
                    />
                  </div>

                  {/* Data */}
                  <div>
                    <label className="text-xs text-cosmic-muted font-medium mb-1 flex items-center gap-1 block">
                      <Calendar size={11} /> Data de nascimento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={date.day} onChange={e => setDate(p => ({ ...p, day: e.target.value }))} className="input-cosmic text-center text-sm">
                        <option value="">Dia</option>
                        {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
                      </select>
                      <select value={date.month} onChange={e => setDate(p => ({ ...p, month: e.target.value }))} className="input-cosmic text-center text-sm">
                        <option value="">Mês</option>
                        {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                      </select>
                      <select value={date.year} onChange={e => setDate(p => ({ ...p, year: e.target.value }))} className="input-cosmic text-center text-sm">
                        <option value="">Ano</option>
                        {Array.from({ length: 100 }, (_, i) => <option key={2010 - i} value={String(2010 - i)}>{2010 - i}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Hora */}
                  <div>
                    <label className="text-xs text-cosmic-muted font-medium mb-1 flex items-center gap-1 block">
                      <Clock size={11} /> Hora de nascimento
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      disabled={noTime}
                      className="input-cosmic disabled:opacity-40"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noTime}
                        onChange={e => { setNoTime(e.target.checked); if (e.target.checked) setTime(''); }}
                        className="accent-cosmic-accent w-4 h-4"
                      />
                      <span className="text-xs text-cosmic-muted">Não sei a hora exata</span>
                    </label>
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="text-xs text-cosmic-muted font-medium mb-1 flex items-center gap-1 block">
                      <MapPin size={11} /> Cidade de nascimento
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
                      <input
                        type="text"
                        placeholder="Buscar cidade..."
                        value={cityQuery}
                        onChange={e => searchCity(e.target.value)}
                        className="input-cosmic pl-9"
                      />
                      {city && (
                        <button onClick={() => { setCity(null); setCityQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-cosmic-muted">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {cityResults.length > 0 && !city && (
                      <div className="glass-card overflow-hidden mt-1">
                        {cityResults.slice(0, 4).map((c, i) => (
                          <button
                            key={i}
                            onClick={() => { setCity(c); setCityQuery(c.displayName); setCityResults([]); }}
                            className="w-full text-left px-3 py-2 text-sm text-cosmic-text hover:bg-gray-50 border-b border-cosmic-border last:border-0"
                          >
                            {c.displayName}
                          </button>
                        ))}
                      </div>
                    )}
                    {city && (
                      <p className="text-xs text-cosmic-accent mt-1">✓ {city.displayName}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="pt-1">
                    <button
                      onClick={handleGenerate}
                      disabled={!isFormValid}
                      className="w-full cosmic-button flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-40"
                    >
                      <Zap size={15} />
                      Criar Mapa
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="salvos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {loadingSaved ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-cosmic-accent/30 border-t-cosmic-accent rounded-full animate-spin" />
              </div>
            ) : savedMaps.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 flex flex-col items-center gap-3 text-center border-dashed border-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-cosmic-accent/10 flex items-center justify-center">
                  <BookmarkPlus size={24} className="text-cosmic-accent" />
                </div>
                <p className="font-semibold text-cosmic-star">Nenhum mapa salvo</p>
                <p className="text-xs text-cosmic-muted">Crie um mapa na aba "Criar Mapa" e salve para acessar aqui</p>
                <button
                  onClick={() => setSubTab('criar')}
                  className="mt-2 cosmic-button text-sm px-6 py-2 flex items-center gap-2"
                >
                  <Plus size={14} /> Criar mapa
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {savedMaps.map((map) => {
                  const isExpanded = expandedMap === map.id;
                  const chart = map.mapa_calculado;
                  const sunSign = chart?.sun?.sign || chart?.sun_sign || '';
                  const moonSign = chart?.moon?.sign || chart?.moon_sign || '';

                  return (
                    <motion.div
                      key={map.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`glass-card overflow-hidden transition-all ${isExpanded ? 'border-cosmic-accent/40' : ''}`}
                    >
                      {/* Header */}
                      <button
                        onClick={() => setExpandedMap(isExpanded ? null : map.id)}
                        className="w-full p-4 flex items-center gap-3 text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-cosmic-accent/20 border border-cosmic-accent/40 flex items-center justify-center font-bold text-lg text-cosmic-star shrink-0">
                          {map.nome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-cosmic-star font-semibold text-sm truncate">{map.nome}</p>
                          <p className="text-cosmic-muted text-xs">
                            {sunSign && `☀️ ${sunSign}`}
                            {moonSign && ` · 🌙 ${moonSign}`}
                            {' · '}
                            {new Date(map.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMap(map.id); }}
                            className="p-2 text-cosmic-muted hover:text-red-400 transition-colors"
                            disabled={deleting === map.id}
                          >
                            {deleting === map.id
                              ? <div className="w-3.5 h-3.5 border-2 border-red-300/30 border-t-red-400 rounded-full animate-spin" />
                              : <Trash2 size={14} />
                            }
                          </button>
                          {isExpanded ? <ChevronUp size={16} className="text-cosmic-muted" /> : <ChevronDown size={16} className="text-cosmic-muted" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-cosmic-border/50 pt-3">
                              <div className="text-xs text-cosmic-muted mb-2 space-y-0.5">
                                {map.hora_nascimento && <p>🕐 {map.hora_nascimento}</p>}
                                {map.cidade_nascimento && <p>📍 {map.cidade_nascimento}</p>}
                              </div>
                              <MapDetailView chart={chart} name={map.nome} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {/* Add more button */}
                <button
                  onClick={() => setSubTab('criar')}
                  className="w-full glass-card p-3 flex items-center justify-center gap-2 text-cosmic-accent text-sm font-medium hover:bg-cosmic-accent/5 transition-all border-dashed border-2"
                >
                  <Plus size={16} /> Criar novo mapa
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
