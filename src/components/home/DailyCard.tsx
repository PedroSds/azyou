import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronRight, Sparkles } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { getQuickAIResponse } from '../../services/aiChat';
import { supabase } from '../../services/supabase';
import { getDailyCard, TAROT_CARDS } from '../../data/tarot';
import type { AstroContext } from '../../services/aiChat';

const ROMAN_NUMERALS = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

export default function DailyCard({ hideTitle }: { hideTitle?: boolean }) {
  const { user, profile, chart } = useUserStore();
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `azyou-tarot-${today}-${user?.id || 'guest'}`;

  // Cache síncrono local para renderização instantânea (0ms delay)
  const cachedData = (() => {
    try {
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const [card, setCard] = useState<typeof TAROT_CARDS[0]>(() => {
    if (cachedData?.numero_carta !== undefined) {
      const found = TAROT_CARDS.find(t => t.number === cachedData.numero_carta);
      if (found) return found;
    }
    return getDailyCard(user?.id || 'guest', today);
  });

  const [flipped, setFlipped] = useState<boolean>(() => !!cachedData);
  const [aiInterpretation, setAiInterpretation] = useState<string>(() => cachedData?.interpretacao_ia || '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [nextCardTime, setNextCardTime] = useState('');

  useEffect(() => {
    if (user) loadCard();

    // Contagem regressiva para meia-noite
    const updateTime = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setNextCardTime(`${h}h ${m}m`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [user, profile, chart]);

  const loadCard = async () => {
    if (!user) return;

    // Sincroniza em segundo plano com Supabase sem travar a UI
    const { data: existing } = await supabase
      .from('cartas_do_dia')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('data_carta', today)
      .maybeSingle();

    if (existing) {
      const c = TAROT_CARDS.find(t => t.number === existing.numero_carta);
      if (c) {
        setCard(c);
        setFlipped(true);
        if (existing.interpretacao_ia) {
          setAiInterpretation(existing.interpretacao_ia);
        }
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }
    }
  };

  const drawCard = async () => {
    if (!card || !user) return;
    setFlipped(true);

    const payload = {
      usuario_id: user.id,
      data_carta: today,
      nome_carta: card.name,
      numero_carta: card.number,
      significado_carta: card.upright,
      interpretacao_ia: null,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    const { data: existing } = await supabase
      .from('cartas_do_dia')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('data_carta', today)
      .maybeSingle();

    if (existing) {
      await supabase.from('cartas_do_dia').update({
        nome_carta: card.name,
        numero_carta: card.number,
        significado_carta: card.upright,
      }).eq('id', existing.id);
    } else {
      await supabase.from('cartas_do_dia').insert(payload);
    }
  };

  const getAIInterpretation = async () => {
    if (!profile || !chart || !card) return;
    setLoadingAI(true);

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

    const prompt = `A carta do Tarot de hoje para ${profile.name} é "${card.name}" (${card.emoji}).

Significado geral: ${card.upright}

Por favor, crie uma interpretação personalizada e profunda desta carta, conectando seu significado com:
1. O Sol em ${chart.sun_sign} e Lua em ${chart.moon_sign} de ${profile.name}
2. Os temas e energias do dia presente
3. Como ${profile.name} pode aplicar essa mensagem na vida prática

Seja caloroso, inspirador e específico. Máximo 3 parágrafos.`;

    const response = await getQuickAIResponse(prompt, context);
    setAiInterpretation(response);

    if (user) {
      localStorage.setItem(storageKey, JSON.stringify({
        usuario_id: user.id,
        data_carta: today,
        nome_carta: card.name,
        numero_carta: card.number,
        significado_carta: card.upright,
        interpretacao_ia: response,
      }));

      await supabase.from('cartas_do_dia')
        .update({ interpretacao_ia: response })
        .eq('usuario_id', user.id)
        .eq('data_carta', today);
    }

    setLoadingAI(false);
  };

  const romanNum = ROMAN_NUMERALS[card.number] ?? card.number;

  return (
    <div className="mb-6 max-w-md mx-auto">
      {!hideTitle && (
        <h3 className="font-serif text-xl text-cosmic-star mb-4 text-center">🃏 Carta do Dia</h3>
      )}

      <AnimatePresence mode="wait">
        {!flipped ? (
          /* Estado Não Revelado: Verso da Carta de Tarot */
          <motion.div
            key="unflipped"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={drawCard}
            className="cursor-pointer mx-auto w-64 aspect-[2/3] max-w-full bg-white p-2.5 rounded-3xl border border-cosmic-border shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-98 relative group select-none"
          >
            {/* Moldura Interna Ornamental */}
            <div className="w-full h-full rounded-2xl border-2 border-dashed border-cosmic-accent/40 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              {/* Ornamentos nos 4 cantos */}
              <span className="absolute top-2 left-2 text-xs text-cosmic-accent/60">✧</span>
              <span className="absolute top-2 right-2 text-xs text-cosmic-accent/60">✧</span>
              <span className="absolute bottom-2 left-2 text-xs text-cosmic-accent/60">✧</span>
              <span className="absolute bottom-2 right-2 text-xs text-cosmic-accent/60">✧</span>

              <div className="relative z-10">
                <div className="text-6xl mb-4 animate-float">🌟</div>
                <p className="text-xs uppercase tracking-widest text-cosmic-muted font-semibold mb-1">Arcano do Dia</p>
                <p className="text-cosmic-star text-base font-bold">Toque para revelar</p>
                <p className="text-cosmic-muted text-xs mt-1">Descubra sua energia de hoje</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Estado Revelado: Carta de Tarot Autêntica com Moldura, Ilustração e Leitura */
          <motion.div
            key="flipped"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full bg-white p-2.5 rounded-[28px] border-2 border-cosmic-border shadow-md select-none"
          >
            {/* Moldura Interna da Carta */}
            <div className="w-full rounded-[20px] border border-cosmic-accent/30 p-4 sm:p-5 relative bg-gradient-to-b from-purple-50/30 via-white to-white">
              {/* Ornamentos dos Cantos */}
              <span className="absolute top-2.5 left-2.5 text-xs text-cosmic-accent/70">✧</span>
              <span className="absolute top-2.5 right-2.5 text-xs text-cosmic-accent/70">✧</span>
              <span className="absolute bottom-2.5 left-2.5 text-xs text-cosmic-accent/70">✧</span>
              <span className="absolute bottom-2.5 right-2.5 text-xs text-cosmic-accent/70">✧</span>

              {/* Cabeçalho do Arcano (Numeração Romana) */}
              <div className="text-center pt-1 pb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-cosmic-muted">
                  ✧ ARCANO {romanNum} ✧
                </p>
              </div>

              {/* Janela Ilustrada da Carta (Art Frame) */}
              <div className="relative rounded-2xl border-2 border-cosmic-border/80 bg-gradient-to-b from-purple-100/40 via-purple-50/20 to-white p-6 text-center shadow-inner overflow-hidden mb-4">
                {/* Elementos místicos de fundo na ilustração */}
                <span className="absolute top-3 left-4 text-xs text-cosmic-accent/40">✦</span>
                <span className="absolute top-3 right-4 text-xs text-cosmic-accent/40">✦</span>
                <span className="absolute bottom-3 left-4 text-xs text-cosmic-accent/40">✦</span>
                <span className="absolute bottom-3 right-4 text-xs text-cosmic-accent/40">✦</span>

                {/* Ilustração Principal / Emoji */}
                <div className="w-24 h-24 rounded-full bg-white/90 border border-cosmic-accent/30 shadow-sm flex items-center justify-center text-5xl mx-auto mb-3.5 relative">
                  <div className="absolute inset-0 rounded-full bg-cosmic-accent/10" />
                  <span className="relative z-10">{card.emoji}</span>
                </div>

                {/* Título e Atributos da Carta no Frame */}
                <h3 className="font-sans text-2xl font-bold uppercase tracking-wide text-cosmic-star">
                  {card.name}
                </h3>
                <p className="text-xs text-cosmic-muted font-medium mt-1">
                  {card.planet} • Elemento {card.element}
                </p>
              </div>

              {/* Divisor Ornamental */}
              <div className="flex items-center justify-center gap-2 text-cosmic-accent/40 my-3 text-xs">
                <span className="h-[1px] w-12 bg-cosmic-border" />
                <span>✦</span>
                <span className="h-[1px] w-12 bg-cosmic-border" />
              </div>

              {/* Corpo da Leitura / Mensagem da Carta */}
              <div className="space-y-3 px-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cosmic-muted mb-1">
                    Significado da Carta
                  </p>
                  <p className="text-cosmic-star text-sm leading-relaxed">
                    {card.upright}
                  </p>
                </div>

                {/* Palavras-chave / Selos */}
                {card.keywords && card.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.keywords.map(kw => (
                      <span
                        key={kw}
                        className="text-xs bg-white text-cosmic-star border border-cosmic-border/80 px-2.5 py-1 rounded-full font-medium shadow-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ação / Interpretação Personalizada com IA */}
              <div className="pt-4 mt-4 border-t border-cosmic-border/80">
                {!aiInterpretation ? (
                  <button
                    onClick={getAIInterpretation}
                    disabled={loadingAI}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm border-2 border-cosmic-accent/30 hover:border-cosmic-accent/60 bg-cosmic-accent/10 hover:bg-cosmic-accent/15 text-cosmic-star transition-all duration-200 active:scale-98 disabled:opacity-50 shadow-xs"
                  >
                    {loadingAI ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Sparkles size={16} className="text-cosmic-accent" />
                    )}
                    <span>
                      {loadingAI ? 'Azy está interpretando...' : '🔮 O que essa carta significa para mim?'}
                    </span>
                  </button>
                ) : (
                  <div className="bg-purple-50/40 border border-cosmic-accent/30 rounded-2xl p-4 text-left shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-cosmic-accent/20 flex items-center justify-center">
                        <Sparkles size={13} className="text-cosmic-accent" />
                      </div>
                      <p className="text-cosmic-star text-xs font-bold uppercase tracking-wider">
                        Interpretação da Azy para você
                      </p>
                    </div>
                    <p className="text-cosmic-star text-sm leading-relaxed whitespace-pre-wrap">
                      {aiInterpretation}
                    </p>
                  </div>
                )}

                <div className="text-center mt-4">
                  <p className="text-[11px] text-cosmic-muted font-medium">
                    Próxima carta disponível em {nextCardTime}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
