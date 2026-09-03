import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { getQuickAIResponse } from '../../services/aiChat';
import { getMoonPhase } from '../../services/astrology';
import { calculateDailyTransits, getTopTransitsByCategory, formatTransitForPrompt } from '../../services/transits';
import type { AstroContext } from '../../services/aiChat';

const AREA_CARDS = [
  { key: 'love', emoji: '❤️', label: 'Amor', color: 'bg-white', border: 'border-cosmic-border' },
  { key: 'money', emoji: '💰', label: 'Dinheiro', color: 'bg-white', border: 'border-cosmic-border' },
  { key: 'emotions', emoji: '🧠', label: 'Emoções', color: 'bg-white', border: 'border-cosmic-border' },
  { key: 'energy', emoji: '⚡', label: 'Energia', color: 'bg-white', border: 'border-cosmic-border' },
];

export default function DailyHoroscope({ hideHeader }: { hideHeader?: boolean }) {
  const { user, profile, chart } = useUserStore();
  const [mainPhrase, setMainPhrase] = useState('');
  const [areaReadings, setAreaReadings] = useState<Record<string, string>>({});
  const [advice, setAdvice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const moonPhase = getMoonPhase();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Usa data local (pt-BR) para não virar o dia às 21h do Brasil (que é 00h UTC)
  const localDateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const cacheKey = `azyou-horoscope-${localDateStr}-${user?.id || profile?.id}`;

  useEffect(() => {
    if (profile && chart) {
      loadHoroscope();
    }
  }, [profile, chart]);

  const loadHoroscope = async () => {
    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data && data.mainPhrase) {
          setMainPhrase(data.mainPhrase);
          setAreaReadings(data.areaReadings || {});
          setAdvice(data.advice || '');
          setLoading(false);
          return;
        }
      } catch {}
    }

    setError(null);
    setLoading(true);
    if (!profile || !chart) return;

    // 1. Calculate real-time transits vs natal chart
    const allTransits = calculateDailyTransits(chart, new Date());
    const byCategory = getTopTransitsByCategory(allTransits);

    // 2. Pick top 2 transits per category for targeted prompts
    const loveTransits = byCategory.love.slice(0, 2).map(formatTransitForPrompt).join('\n') || 'Nenhum trânsito específico encontrado para amor hoje.';
    const moneyTransits = byCategory.money.slice(0, 2).map(formatTransitForPrompt).join('\n') || 'Nenhum trânsito específico encontrado para finanças hoje.';
    const emotionsTransits = byCategory.emotions.slice(0, 2).map(formatTransitForPrompt).join('\n') || `Fase da Lua: ${moonPhase.phase} (${moonPhase.illumination}% iluminada)`;
    const energyTransits = byCategory.energy.slice(0, 2).map(formatTransitForPrompt).join('\n') || 'Nenhum trânsito específico encontrado para energia hoje.';
    const topTransit = allTransits[0] ? formatTransitForPrompt(allTransits[0]) : 'Dia de energia neutra sem aspectos tensos.';

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

    try {
      const prompt = `Data de hoje: ${today}
Fase da Lua: ${moonPhase.emoji} ${moonPhase.phase} (${moonPhase.illumination}% iluminada)

=== SISTEMA RAG — REGRAS ASTROLÓGICAS VIGENTES ===
Você DEVE basear cada área ESTRITAMENTE nos trânsitos e regras técnicas listados abaixo.
NÃO invente interpretações genéricas. Use APENAS as premissas técnicas fornecidas.

AMOR (trânsitos que afetam relacionamentos hoje):
${loveTransits}

DINHEIRO (trânsitos que afetam finanças hoje):
${moneyTransits}

EMOÇÕES (trânsitos que afetam o estado emocional hoje):
${emotionsTransits}

ENERGIA (trânsitos que afetam vitalidade e ação hoje):
${energyTransits}

TRÂNSITO MAIS IMPORTANTE DO DIA (use para o conselho):
${topTransit}

=== TAREFA ===
Baseado nos dados acima e no mapa natal de ${profile.name} (Sol em ${chart.sun_sign}, Lua em ${chart.moon_sign}${chart.ascendant ? `, ASC em ${chart.ascendant}` : ''}):
Escreva a leitura do dia de forma empática e poética, citando os astros envolvidos.

Retorne APENAS um JSON válido (sem markdown):
{
  "mainPhrase": "1-2 frases inspiradoras sobre a energia principal do dia, baseada no trânsito mais importante",
  "areas": {
    "love": "2-3 frases sobre amor baseadas DIRETAMENTE nos trânsitos de amor acima",
    "money": "2-3 frases sobre finanças baseadas DIRETAMENTE nos trânsitos de dinheiro acima",
    "emotions": "2-3 frases sobre emoções baseadas DIRETAMENTE nos trânsitos emocionais acima",
    "energy": "2-3 frases sobre energia vital baseadas DIRETAMENTE nos trânsitos de energia acima"
  },
  "advice": "1 conselho prático e específico baseado no trânsito mais importante do dia"
}`;

      const responseText = await getQuickAIResponse(prompt, context);
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      setMainPhrase(data.mainPhrase);
      setAreaReadings(data.areas);
      setAdvice(data.advice);

      // Cache for the day
      localStorage.setItem(cacheKey, JSON.stringify({
        mainPhrase: data.mainPhrase,
        areaReadings: data.areas,
        advice: data.advice,
      }));
    } catch (err: any) {
      console.error('Horoscope error:', err);
      setError('A Azy está sobrecarregada lendo as estrelas de muitas pessoas agora. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !chart) return null;

  return (
    <div className="py-2">
      {!hideHeader && (
        <>
          {/* Header */}
          <div className="mb-6">
            <p className="text-cosmic-muted text-sm capitalize">{today}</p>
            <h1 className="font-cursive text-5xl text-cosmic-star mt-1">
              Olá, {profile.name}!
            </h1>
          </div>

          {/* Moon phase */}
          <div className="glass-card p-3 mb-6 flex items-center gap-3">
            <span className="text-2xl">{moonPhase.emoji}</span>
            <div>
              <p className="text-cosmic-star text-sm font-medium">{moonPhase.phase}</p>
              <p className="text-cosmic-muted text-xs">{moonPhase.illumination}% iluminada</p>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="glass-card p-4 mb-6 border-red-500/30 bg-red-50/50">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button 
            onClick={loadHoroscope}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-white rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      )}

      {/* Main phrase (Mantra) */}
      <motion.div
        layout
        className="glass-card p-5 sm:p-6 mb-6 relative overflow-hidden shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="text-black text-xs md:text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-cosmic-purple" /> Mantra do dia
        </h3>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
          </div>
        ) : (
          <p className="text-cosmic-text text-base leading-relaxed">
            "{mainPhrase}"
          </p>
        )}
      </motion.div>

      {/* Area cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {AREA_CARDS.map(({ key, emoji, label, color, border }) => (
          <motion.button
            key={key}
            onClick={() => setActiveCard(activeCard === key ? null : key)}
            className={`glass-card p-4 text-left ${color} border ${border} hover:border-cosmic-purple transition-all duration-200 active:scale-95`}
          >
            <span className="text-2xl mb-2 block">{emoji}</span>
            <p className="text-cosmic-star text-sm font-medium">{label}</p>
            {loading ? (
              <div className="mt-2 h-2 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className={`text-cosmic-muted text-xs mt-1 ${activeCard === key ? '' : 'line-clamp-2'}`}>
                {areaReadings[key] || 'Carregando...'}
              </p>
            )}
            <ChevronRight
              size={14}
              className={`text-cosmic-muted mt-2 transition-transform ${activeCard === key ? 'rotate-90' : ''}`}
            />
          </motion.button>
        ))}
      </div>

      {/* Daily advice */}
      {advice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-6 mb-6 shadow-sm"
        >
          <h3 className="text-black text-xs md:text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-cosmic-purple" /> Conselho do dia
          </h3>
          <p className="text-cosmic-text text-base leading-relaxed">{advice}</p>
        </motion.div>
      )}
    </div>
  );
}
