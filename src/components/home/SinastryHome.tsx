import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, Trash2, ChevronRight, Search, User, Calendar, Clock, MapPin,
  Zap, X, ArrowLeft, Sparkles
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { getQuickAIResponse } from '../../services/aiChat';
import { calculateBirthChart, calculateSinastryScores, PLANET_NAMES } from '../../services/astrology';
import type { SinastryScores } from '../../services/astrology';
import { searchCities, type CityResult } from '../../services/geocoding';
import { supabase } from '../../services/supabase';
import type { AstroContext } from '../../services/aiChat';

interface SavedPerson {
  id: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_city?: string;
  birth_lat?: number;
  birth_lon?: number;
  mapa_calculado?: any;
}

interface SinastryResult {
  love: number;
  communication: number;
  chemistry: number;
  relationship: number;
  overall: number;
  analysis: string;
  loadingAnalysis: boolean;
  partnerName: string;
  partnerSun: string;
}

const ScoreBar = ({ score, label }: { score: number; label: string }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-cosmic-text font-medium">{label}</span>
      <span className="text-cosmic-accent font-semibold">{score}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, delay: 0.2 }}
        className="h-full rounded-full bg-cosmic-accent"
      />
    </div>
  </div>
);

interface Props {
  tempMap?: {
    name: string;
    birth_date: string;
    birth_time?: string;
    birth_city?: string;
    birth_lat?: number;
    birth_lon?: number;
    chart?: any;
  } | null;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function SinastryHome({ tempMap }: Props) {
  const { profile, chart, user } = useUserStore() as any;
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<SavedPerson | null>(null);
  const [result, setResult] = useState<SinastryResult | null>(null);

  // Quick form state (no need to go to "Criar Mapa")
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [qName, setQName] = useState('');
  const [qDate, setQDate] = useState({ day: '', month: '', year: '' });
  const [qTime, setQTime] = useState('');
  const [qNoTime, setQNoTime] = useState(false);
  const [qCityQuery, setQCityQuery] = useState('');
  const [qCityResults, setQCityResults] = useState<CityResult[]>([]);
  const [qCity, setQCity] = useState<CityResult | null>(null);
  const [qCalculating, setQCalculating] = useState(false);

  const loadSaved = useCallback(async () => {
    if (!user) { setLoadingList(false); return; }
    setLoadingList(true);
    const { data } = await supabase
      .from('mapas_pessoas')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      name: d.nome,
      birth_date: d.data_nascimento,
      birth_time: d.hora_nascimento || undefined,
      birth_city: d.cidade_nascimento || undefined,
      birth_lat: d.latitude_nascimento || undefined,
      birth_lon: d.longitude_nascimento || undefined,
      mapa_calculado: d.mapa_calculado,
    }));
    setSavedPeople(mapped);
    setLoadingList(false);
  }, [user]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If a new tempMap comes in, auto-select it
  useEffect(() => {
    if (tempMap) {
      const asPerson: SavedPerson = {
        id: '__temp__',
        name: tempMap.name,
        birth_date: tempMap.birth_date,
        birth_time: tempMap.birth_time,
        birth_city: tempMap.birth_city,
        birth_lat: tempMap.birth_lat,
        birth_lon: tempMap.birth_lon,
        mapa_calculado: tempMap.chart,
      };
      setSelected(asPerson);
      setResult(null);
      setErrorMsg(null);
      calculateSinastry(asPerson);
    }
  }, [tempMap]);

  const PNAMES: Record<string, string> = {
    sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
    jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão'
  };

  const formatPlanets = (planets: Record<string, any>) => {
    if (!planets) return '';
    return Object.entries(planets).map(([k, p]: any) => {
      if (!p) return '';
      const sign = p.sign || p.signo || '';
      const degree = p.degree !== undefined ? p.degree : (p.grau !== undefined ? p.grau : undefined);
      const house = p.house || p.casa || '';
      const retro = p.retrograde || p.retrogrado ? ' ℞' : '';
      const degreeStr = degree !== undefined ? ` ${Number(degree).toFixed(1)}°` : '';
      const houseStr = house ? ` · Casa ${house}` : '';
      return `${PNAMES[k] || k}: ${sign}${degreeStr}${houseStr}${retro}`;
    }).filter(Boolean).join(', ');
  };

  // Generate a stable cache key for a pair
  const getCacheKey = (personBirthDate: string, personName: string) => {
    const userId = user?.id || 'anon';
    return `azyou-sinastry-${userId}-${personBirthDate}-${personName.trim().toLowerCase()}`;
  };

  const calculateSinastry = async (person: SavedPerson) => {
    if (!profile || !chart) return;
    setResult(null);
    setErrorMsg(null);
    setSelected(person);

    try {
      // 1. Resolve partner chart
      let parsedChart = person.mapa_calculado;
      if (typeof parsedChart === 'string') {
        try { parsedChart = JSON.parse(parsedChart); } catch(e) {}
      }

      const partnerChart = parsedChart || calculateBirthChart({
        birthDate: person.birth_date,
        birthTime: person.birth_time || undefined,
        lat: person.birth_lat || 0,
        lon: person.birth_lon || 0,
      }, person.birth_date);

      const partnerSunSign = partnerChart.sun?.sign || partnerChart.sun_sign || '';

      // 2. DETERMINISTIC SCORES — instant, always identical
      // Build a chart object compatible with calculateSinastryScores
      const myChart = {
        sun: { sign: chart.sun_sign, degree: chart.sun_degree || 0 },
        moon: { sign: chart.moon_sign, degree: chart.moon_degree || 0 },
        ascendant: chart.ascendant ? { sign: chart.ascendant, degree: chart.asc_degree || 0, signIndex: 0 } : null,
        midheaven: chart.midheaven ? { sign: chart.midheaven, degree: 0, signIndex: 0 } : null,
        planets: chart.planets || {},
        houses: chart.houses || {},
        aspects: chart.aspects || [],
        venus_sign: chart.venus_sign || '',
        personal_arcanum: chart.personal_arcanum || 0,
      };

      const scores = calculateSinastryScores(myChart as any, partnerChart as any);

      // 3. Show scores IMMEDIATELY (no loading needed)
      const cacheKey = getCacheKey(person.birth_date, person.name);
      const cachedAnalysis = localStorage.getItem(cacheKey);

      setResult({
        love: scores.love,
        communication: scores.communication,
        chemistry: scores.chemistry,
        relationship: scores.relationship,
        overall: scores.overall,
        analysis: cachedAnalysis || '',
        loadingAnalysis: !cachedAnalysis,
        partnerName: person.name,
        partnerSun: partnerSunSign,
      });

      // 4. If no cached analysis, request AI narrative in background
      if (!cachedAnalysis) {
        loadAIAnalysis(person, partnerChart, scores, cacheKey);
      }

    } catch (err: any) {
      console.error('Erro na sinastria:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao calcular a sinastria.');
    }
  };

  // AI narrative loader (runs in background after scores are shown)
  const loadAIAnalysis = async (
    person: SavedPerson,
    partnerChart: any,
    scores: SinastryScores,
    cacheKey: string
  ) => {
    try {
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

      const partnerSunSign = partnerChart.sun?.sign || partnerChart.sun_sign || '';
      const partnerMoonSign = partnerChart.moon?.sign || partnerChart.moon_sign || '';
      const partnerAscSign = partnerChart.ascendant?.sign || (typeof partnerChart.ascendant === 'string' ? partnerChart.ascendant : '');

      // List the strongest inter-aspects for the AI to interpret
      const topAspects = scores.interAspects
        .filter(a => ['sun', 'moon', 'venus', 'mars', 'mercury'].includes(a.planet1) || ['sun', 'moon', 'venus', 'mars', 'mercury'].includes(a.planet2))
        .slice(0, 10)
        .map(a => `${PNAMES[a.planet1] || a.planet1} ${a.symbol} ${PNAMES[a.planet2] || a.planet2} (${a.type}, orbe ${a.orb}°)`)
        .join('\n');

      const prompt = `Escreva uma análise de sinastria astrológica entre:

PESSOA 1: ${profile.name} — Sol em ${chart.sun_sign}, Lua em ${chart.moon_sign}${chart.ascendant ? `, ASC em ${chart.ascendant}` : ''}
PESSOA 2: ${person.name} — Sol em ${partnerSunSign}, Lua em ${partnerMoonSign}${partnerAscSign ? `, ASC em ${partnerAscSign}` : ''}

Os scores de compatibilidade já foram calculados algoritmicamente:
❤️ Amor: ${scores.love}%
💬 Comunicação: ${scores.communication}%
🔥 Química: ${scores.chemistry}%
🤝 Relacionamento: ${scores.relationship}%

Aspectos inter-chart mais relevantes:
${topAspects}

Escreva 2-3 parágrafos interpretando esses resultados. JUSTIFIQUE os scores citando os aspectos específicos. Não repita os números, apenas explique o que eles significam na prática. Responda APENAS o texto, sem JSON.`;

      const response = await getQuickAIResponse(prompt, context);
      const analysisText = response.trim();

      if (analysisText) {
        // Cache for future use
        localStorage.setItem(cacheKey, analysisText);
        // Update result with analysis
        setResult(prev => prev ? { ...prev, analysis: analysisText, loadingAnalysis: false } : prev);
      }
    } catch (err: any) {
      console.error('Erro ao carregar análise da IA:', err);
      setResult(prev => prev ? { ...prev, loadingAnalysis: false, analysis: prev.analysis || 'Não foi possível gerar a análise textual.' } : prev);
    }
  };


  // Quick form handlers
  const searchQuickCity = async (q: string) => {
    setQCityQuery(q);
    setQCity(null);
    if (q.length < 2) { setQCityResults([]); return; }
    const results = await searchCities(q);
    setQCityResults(results);
  };

  const isQuickFormValid = qName.trim() && qDate.day && qDate.month && qDate.year;

  const handleQuickCalculate = async () => {
    if (!isQuickFormValid) return;
    setQCalculating(true);

    const dateStr = `${qDate.year}-${qDate.month.padStart(2, '0')}-${qDate.day.padStart(2, '0')}`;
    const chartData = calculateBirthChart({
      birthDate: dateStr,
      birthTime: qNoTime ? undefined : qTime || undefined,
      lat: qCity?.lat || 0,
      lon: qCity?.lon || 0,
      timezone: qCity?.timezone || undefined,
    }, dateStr);

    const person: SavedPerson = {
      id: '__quick__',
      name: qName.trim(),
      birth_date: dateStr,
      birth_time: qNoTime ? undefined : qTime || undefined,
      birth_city: qCity?.displayName || undefined,
      birth_lat: qCity?.lat || undefined,
      birth_lon: qCity?.lon || undefined,
      mapa_calculado: chartData,
    };

    setShowQuickForm(false);
    await calculateSinastry(person);
    setQCalculating(false);
  };

  const resetQuickForm = () => {
    setQName('');
    setQDate({ day: '', month: '', year: '' });
    setQTime('');
    setQNoTime(false);
    setQCityQuery('');
    setQCityResults([]);
    setQCity(null);
  };

  if (!profile || !chart) return null;

  const allPeople: SavedPerson[] = tempMap
    ? [
        { id: '__temp__', name: tempMap.name, birth_date: tempMap.birth_date, birth_time: tempMap.birth_time, birth_city: tempMap.birth_city, mapa_calculado: tempMap.chart },
        ...savedPeople,
      ]
    : savedPeople;

  return (
    <div className="py-4">
      {/* Result / Loading / Error Box */}
      <AnimatePresence mode="wait">
        {(result || errorMsg) && selected && (
          <motion.div
            key="result-box"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setSelected(null); setResult(null); setErrorMsg(null); }}
                className="w-8 h-8 rounded-full bg-cosmic-accent/10 flex items-center justify-center text-cosmic-accent hover:bg-cosmic-accent/20 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-cosmic-star font-semibold">
                Sua sinastria com {selected.name.split(' ')[0]}
              </h2>
            </div>

            {errorMsg ? (
              <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 text-center border border-red-400/30 bg-red-400/5">
                <div className="w-12 h-12 rounded-full bg-red-400/20 flex items-center justify-center text-red-400">
                  <X size={20} />
                </div>
                <div>
                  <p className="text-red-400 font-medium mb-1">Ops, algo deu errado!</p>
                  <p className="text-xs text-cosmic-muted">{errorMsg}</p>
                </div>
                <button
                  onClick={() => calculateSinastry(selected)}
                  className="mt-2 text-sm text-cosmic-accent font-medium hover:underline flex items-center gap-1"
                >
                  <Zap size={14} /> Tentar novamente
                </button>
              </div>
            ) : result ? (
              <div className="glass-card p-5 border border-cosmic-accent/20">
                <div className="text-center mb-6">
                  <p className="text-2xl mb-2">💞</p>
                  <p className="text-cosmic-star font-semibold text-lg">{profile.name} & {result.partnerName}</p>
                  <p className="text-cosmic-muted text-sm">{chart.sun_sign} · {result.partnerSun}</p>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-cosmic-star">
                      {result.overall}%
                    </span>
                    <p className="text-cosmic-muted text-xs mt-1">compatibilidade geral</p>
                  </div>
                </div>

                <ScoreBar score={result.love} label="❤️ Amor" />
                <ScoreBar score={result.communication} label="💬 Comunicação" />
                <ScoreBar score={result.chemistry} label="🔥 Química" />
                <ScoreBar score={result.relationship} label="🤝 Relacionamento" />

                {/* AI Narrative Analysis */}
                <div className="mt-4 pt-4 border-t border-cosmic-border">
                  {result.loadingAnalysis ? (
                    <div className="flex items-center gap-2 text-cosmic-muted text-sm py-3">
                      <Sparkles size={14} className="text-cosmic-accent animate-pulse" />
                      <span>Gerando interpretação astrológica...</span>
                    </div>
                  ) : result.analysis ? (
                    <p className="text-cosmic-text text-sm leading-relaxed">{result.analysis}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* People list & Quick form */}
      {!result && !errorMsg && (
        <>
          <p className="text-cosmic-muted text-sm mb-4">
            Selecione uma pessoa salva ou insira dados temporários para ver a compatibilidade astrológica.
          </p>

          {/* Quick calculate button */}
          <AnimatePresence mode="wait">
            {showQuickForm ? (
              <motion.div
                key="quickform"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="glass-card p-5 mb-4 space-y-3 border border-cosmic-accent/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-cosmic-star font-semibold text-sm">Sinastria rápida</h3>
                  <button onClick={() => { setShowQuickForm(false); resetQuickForm(); }} className="text-cosmic-muted hover:text-cosmic-star">
                    <X size={16} />
                  </button>
                </div>

                {/* Nome */}
                <div>
                  <label className="text-[11px] text-cosmic-muted font-medium mb-0.5 flex items-center gap-1 block">
                    <User size={10} /> Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da pessoa"
                    value={qName}
                    onChange={e => setQName(e.target.value)}
                    className="input-cosmic text-sm"
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="text-[11px] text-cosmic-muted font-medium mb-0.5 flex items-center gap-1 block">
                    <Calendar size={10} /> Data de nascimento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={qDate.day} onChange={e => setQDate(p => ({ ...p, day: e.target.value }))} className="input-cosmic text-center text-xs">
                      <option value="">Dia</option>
                      {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
                    </select>
                    <select value={qDate.month} onChange={e => setQDate(p => ({ ...p, month: e.target.value }))} className="input-cosmic text-center text-xs">
                      <option value="">Mês</option>
                      {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                    </select>
                    <select value={qDate.year} onChange={e => setQDate(p => ({ ...p, year: e.target.value }))} className="input-cosmic text-center text-xs">
                      <option value="">Ano</option>
                      {Array.from({ length: 100 }, (_, i) => <option key={2010 - i} value={String(2010 - i)}>{2010 - i}</option>)}
                    </select>
                  </div>
                </div>

                {/* Hora */}
                <div>
                  <label className="text-[11px] text-cosmic-muted font-medium mb-0.5 flex items-center gap-1 block">
                    <Clock size={10} /> Hora de nascimento
                  </label>
                  <input
                    type="time"
                    value={qTime}
                    onChange={e => setQTime(e.target.value)}
                    disabled={qNoTime}
                    className="input-cosmic text-sm disabled:opacity-40"
                  />
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qNoTime}
                      onChange={e => { setQNoTime(e.target.checked); if (e.target.checked) setQTime(''); }}
                      className="accent-cosmic-accent w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-cosmic-muted">Não sei a hora exata</span>
                  </label>
                </div>

                {/* Cidade */}
                <div>
                  <label className="text-[11px] text-cosmic-muted font-medium mb-0.5 flex items-center gap-1 block">
                    <MapPin size={10} /> Cidade de nascimento
                  </label>
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
                    <input
                      type="text"
                      placeholder="Buscar cidade..."
                      value={qCityQuery}
                      onChange={e => searchQuickCity(e.target.value)}
                      className="input-cosmic pl-8 text-sm"
                    />
                    {qCity && (
                      <button onClick={() => { setQCity(null); setQCityQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-cosmic-muted">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {qCityResults.length > 0 && !qCity && (
                    <div className="glass-card overflow-hidden mt-1">
                      {qCityResults.slice(0, 4).map((c, i) => (
                        <button
                          key={i}
                          onClick={() => { setQCity(c); setQCityQuery(c.displayName); setQCityResults([]); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-cosmic-text hover:bg-gray-50 border-b border-cosmic-border last:border-0"
                        >
                          {c.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                  {qCity && <p className="text-[11px] text-cosmic-accent mt-0.5">✓ {qCity.displayName}</p>}
                </div>

                {/* Calcular */}
                <button
                  onClick={handleQuickCalculate}
                  disabled={!isQuickFormValid || qCalculating}
                  className="w-full cosmic-button flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-40"
                >
                  {qCalculating
                    ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : <Heart size={15} />
                  }
                  {qCalculating ? 'Calculando...' : 'Calcular sinastria'}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="quickbtn"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={() => setShowQuickForm(true)}
                className="w-full cosmic-button flex items-center justify-center gap-2 text-sm py-3 mb-4"
              >
                <Zap size={16} /> Fazer sinastria
              </motion.button>
            )}
          </AnimatePresence>

          {/* Saved maps list */}
          {loadingList ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-cosmic-accent/30 border-t-cosmic-accent rounded-full animate-spin" />
            </div>
          ) : allPeople.length === 0 && !showQuickForm ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 flex flex-col items-center gap-3 text-center border-dashed border-2"
            >
              <div className="w-14 h-14 rounded-2xl bg-cosmic-accent/10 flex items-center justify-center">
                <Users size={24} className="text-cosmic-accent" />
              </div>
              <p className="font-semibold text-cosmic-star">Nenhum mapa salvo</p>
              <p className="text-xs text-cosmic-muted">
                Salve mapas na aba <span className="font-bold">Criar Mapa</span> ou use o botão acima para calcular direto
              </p>
            </motion.div>
          ) : allPeople.length > 0 && (
            <>
              {allPeople.length > 0 && (
                <p className="text-cosmic-muted text-xs font-medium mb-2 uppercase tracking-wider">
                  Mapas disponíveis
                </p>
              )}
              <div className="space-y-2">
                {allPeople.map((person) => {
                  const isTemp = person.id === '__temp__';
                  const isSelected = selected?.id === person.id;
                  const partnerChart = person.mapa_calculado;
                  const sunSign = partnerChart?.sun?.sign || partnerChart?.sun_sign || '';

                  return (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`glass-card p-4 flex items-center gap-3 transition-all ${isSelected ? 'border-cosmic-accent/60 bg-cosmic-accent/5' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${isTemp ? 'bg-cosmic-accent/10 border border-dashed border-cosmic-accent/40' : 'bg-cosmic-accent/20 border border-cosmic-accent/40'} text-cosmic-star`}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-cosmic-star font-semibold text-sm truncate">{person.name}</p>
                          {isTemp && (
                            <span className="text-[10px] bg-cosmic-accent/20 text-cosmic-accent px-2 py-0.5 rounded-full font-medium shrink-0">temporário</span>
                          )}
                        </div>
                        <p className="text-xs text-cosmic-muted">
                          {sunSign && `☀️ ${sunSign} · `}
                          {new Date(person.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {person.birth_city && ` · ${person.birth_city.split(',')[0]}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => calculateSinastry(person)}
                          className="flex items-center gap-1 bg-cosmic-accent/90 hover:bg-cosmic-accent text-black text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95"
                        >
                          <Heart size={12} />
                          Ver sinastria
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
