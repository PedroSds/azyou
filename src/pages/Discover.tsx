import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, CalendarDays, Heart, Moon, Briefcase, Star } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getQuickAIResponse } from '../services/aiChat';
import { calculatePersonalArcanum, calculateYearArcanum, getMoonPhase, getCurrentTransits, PLANET_NAMES } from '../services/astrology';
import { ARCANUM_INFO } from '../data/tarot';
import { VENUS_STYLE } from '../data/astroData';
import AppLayout from '../components/layout/AppLayout';
import DailyCard from '../components/home/DailyCard';
import { AstroIcon } from '../components/ui/AstroIcons';
import type { AstroContext } from '../services/aiChat';

const DISCOVER_SECTIONS = [
  { id: 'events', icon: CalendarDays, label: 'Eventos Astrológicos' },
  { id: 'arcanum', icon: Sparkles, label: 'Arcano Pessoal' },
  { id: 'year-arcanum', icon: CalendarDays, label: 'Arcano do Ano' },
  { id: 'venus-style', icon: Heart, label: 'Estilo segundo Vênus' },
];

// Astrological events (static + calculated)
const ASTRO_EVENTS = [
  { name: 'Lua Nova em Virgem', icon: 'moon', date: '2026-09-07', type: 'Lua Nova', description: 'Momento de plantar novas intenções, especialmente em saúde, rotinas e serviço.' },
  { name: 'Mercúrio Direto', icon: 'mercury', date: '2026-09-12', type: 'Trânsito', description: 'Mercúrio retoma seu movimento direto. Comunicações e decisões voltam ao normal.' },
  { name: 'Lua Cheia em Peixes', icon: 'moon', date: '2026-09-21', type: 'Lua Cheia', description: 'Culminação de ciclos emocionais e espirituais. Sensibilidade e intuição em alta.' },
  { name: 'Eclipse Solar em Libra', icon: 'moon', date: '2026-10-14', type: 'Eclipse', description: 'Poderoso eclipse marcando novos começos em relacionamentos, parcerias e equilíbrio.' },
  { name: 'Vênus em Escorpião', icon: 'venus', date: '2026-10-05', type: 'Ingresso', description: 'Vênus em Escorpião intensifica emoções, atração e profundidade nos relacionamentos.' },
];

export default function Discover() {
  const { user, profile, chart } = useUserStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof ASTRO_EVENTS[0] | null>(null);
  const [eventAI, setEventAI] = useState('');
  const [loadingEventAI, setLoadingEventAI] = useState(false);
  const [arcanoAI, setArcanoAI] = useState('');
  const [venusAI, setVenusAI] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

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

  const personalArcanum = chart.personal_arcanum;
  const yearArcanum = calculateYearArcanum(profile.birth_date);
  const arcanoInfo = ARCANUM_INFO[personalArcanum];
  const yearArcanoInfo = ARCANUM_INFO[yearArcanum];
  const venusStyle = chart.venus_sign ? VENUS_STYLE[chart.venus_sign] : null;

  const handleEventAI = async (event: typeof ASTRO_EVENTS[0]) => {
    setSelectedEvent(event);
    setEventAI('');
    setLoadingEventAI(true);

    const prompt = `Evento astrológico: ${event.name} em ${event.date}
Descrição: ${event.description}

Explique em 2-3 parágrafos:
1. Como esse evento afeta especificamente ${profile.name} (Sol em ${chart.sun_sign}, Lua em ${chart.moon_sign}${chart.ascendant ? `, Ascendente em ${chart.ascendant}` : ''})
2. Quais áreas da vida serão mais ativadas
3. Um conselho prático para aproveitar ou navegar esse período`;

    const response = await getQuickAIResponse(prompt, context);
    setEventAI(response);
    setLoadingEventAI(false);
  };

  const handleArcanoAI = async () => {
    if (arcanoAI) return;
    setLoadingAI(true);
    const prompt = `${profile.name} tem o Arcano ${personalArcanum} (${arcanoInfo?.name}) como carta natal.

Faça uma interpretação personalizada e profunda desse Arcano, conectando com:
- Sol em ${chart.sun_sign}
- Lua em ${chart.moon_sign}  
- Os padrões de vida de ${profile.name}

Como esse Arcano se manifesta especificamente no mapa e na vida de ${profile.name}? 2-3 parágrafos.`;

    const response = await getQuickAIResponse(prompt, context);
    setArcanoAI(response);
    setLoadingAI(false);
  };

  const handleVenusAI = async () => {
    if (venusAI) return;
    setLoadingAI(true);
    const venusSign = chart.venus_sign || chart.planets?.venus?.sign;
    const prompt = `${profile.name} tem Vênus em ${venusSign}.

Crie uma análise aprofundada do estilo pessoal e estético de ${profile.name}, considerando:
- Vênus em ${venusSign}: o que isso revela sobre seu gosto estético, o que a atrai visualmente
- Como o Sol em ${chart.sun_sign} complementa esse estilo
- Sugestões práticas e específicas de estilo, cores e estética que combinam com ${profile.name}

Seja criativo(a), específico(a) e inspirador(a). 2-3 parágrafos.`;

    const response = await getQuickAIResponse(prompt, context);
    setVenusAI(response);
    setLoadingAI(false);
  };


  return (
    <AppLayout>
      <div className="py-6">
        <h1 className="font-serif text-3xl text-cosmic-star mb-6 flex items-center gap-2"><Star className="text-cosmic-gold" /> Descobrir</h1>

        {/* Section list */}
        <div className="space-y-3">
          {DISCOVER_SECTIONS.map(({ id, icon: Icon, label }) => (
            <div key={id}>
              <motion.button
                onClick={() => setActiveSection(activeSection === id ? null : id)}
                className="w-full glass-card p-4 flex items-center gap-3 hover:border-cosmic-accent/30 transition-all active:scale-98"
              >
                <div className="w-8 h-8 rounded-full bg-cosmic-accent/10 flex items-center justify-center">
                    <Icon size={16} className="text-cosmic-accent" />
                </div>
                <span className="text-cosmic-star font-medium flex-1 text-left">{label}</span>
                <ChevronRight size={16} className={`text-cosmic-muted transition-transform ${activeSection === id ? 'rotate-90' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {activeSection === id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-3">
                      {/* TAROT */}
                      {id === 'tarot' && (
                        <DailyCard hideTitle />
                      )}

                      {/* EVENTS */}
                      {id === 'events' && (
                        <>
                          {ASTRO_EVENTS.map((event, i) => (
                            <div key={i} className="glass-card p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cosmic-bg flex items-center justify-center border border-cosmic-border shrink-0 shadow-sm">
                                  <AstroIcon name={event.icon} className="w-5 h-5 text-[#B39EB5]" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-cosmic-star font-medium text-sm">{event.name}</p>
                                  <p className="text-cosmic-muted text-xs">{new Date(event.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} · {event.type}</p>
                                  <p className="text-cosmic-text text-xs mt-2">{event.description}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleEventAI(event)}
                                className="mt-3 w-full cosmic-button-outline py-2 text-xs flex items-center justify-center gap-1"
                              >
                                <Sparkles size={12} /> Como isso me afeta?
                              </button>
                              {selectedEvent?.name === event.name && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  {loadingEventAI ? (
                                    <div className="space-y-2">
                                      <div className="h-3 bg-white/10 rounded animate-pulse" />
                                      <div className="h-3 bg-white/10 rounded animate-pulse w-4/5" />
                                    </div>
                                  ) : (
                                    <p className="text-cosmic-text text-xs leading-relaxed">{eventAI}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {/* ARCANO PESSOAL */}
                      {id === 'arcanum' && arcanoInfo && (
                        <div className="glass-card p-5">
                          <div className="text-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-cosmic-accent/20 mx-auto flex items-center justify-center text-cosmic-star border border-cosmic-accent/30 shadow-glow mb-4">
                              <Sparkles size={28} />
                            </div>
                            <p className="text-cosmic-gold font-serif text-2xl">{personalArcanum}</p>
                            <p className="text-cosmic-star font-serif text-xl">{arcanoInfo.name}</p>
                            <p className="text-cosmic-muted text-sm">{arcanoInfo.theme}</p>
                          </div>
                          <p className="text-cosmic-text text-sm leading-relaxed mb-4">{arcanoInfo.personality}</p>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                              { icon: Heart, label: 'Amor', text: arcanoInfo.love },
                              { icon: Briefcase, label: 'Carreira', text: arcanoInfo.career },
                            ].map(({ icon: Icon, label, text }) => (
                              <div key={label} className="bg-white/5 rounded-xl p-3">
                                <p className="text-xs text-cosmic-muted mb-1 flex items-center gap-1">
                                  <Icon size={12} /> {label}
                                </p>
                                <p className="text-xs text-cosmic-text leading-relaxed">{text}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mb-4">
                            <p className="text-cosmic-lilac text-xs font-medium mb-2">✨ Pontos Fortes</p>
                            <div className="flex flex-wrap gap-1">
                              {arcanoInfo.strengths.map(s => (
                                <span key={s} className="text-xs bg-cosmic-accent/20 text-cosmic-lilac px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                          <button onClick={handleArcanoAI} disabled={loadingAI} className="w-full cosmic-button-outline py-2 text-sm flex items-center justify-center gap-2">
                            {loadingAI ? <div className="w-4 h-4 border-2 border-cosmic-accent/30 border-t-cosmic-accent rounded-full animate-spin" /> : <Sparkles size={14} />}
                            Interpretação personalizada
                          </button>
                          {arcanoAI && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <p className="text-cosmic-text text-sm leading-relaxed">{arcanoAI}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ARCANO DO ANO */}
                      {id === 'year-arcanum' && yearArcanoInfo && (
                        <div className="glass-card p-5 text-center">
                          <div className="w-16 h-16 rounded-full bg-cosmic-accent/20 mx-auto flex items-center justify-center text-cosmic-star border border-cosmic-accent/30 shadow-glow mb-4">
                            <CalendarDays size={28} />
                          </div>
                          <p className="text-cosmic-muted text-sm mb-1">Seu Arcano de {new Date().getFullYear()}</p>
                          <p className="text-cosmic-gold font-serif text-2xl">{yearArcanum}</p>
                          <p className="text-cosmic-star font-serif text-xl mb-4">{yearArcanoInfo.name}</p>
                          <p className="text-cosmic-muted text-sm mb-3">{yearArcanoInfo.theme}</p>
                          <p className="text-cosmic-text text-sm leading-relaxed">{yearArcanoInfo.personality}</p>
                        </div>
                      )}


                      {/* VENUS STYLE */}
                      {id === 'venus-style' && venusStyle && (
                        <div className="glass-card p-5">
                          <div className="text-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center border border-[#B39EB5]/30 shadow-sm mb-4">
                               <AstroIcon name="venus" className="w-8 h-8 text-[#B39EB5]" />
                            </div>
                            <p className="text-cosmic-star text-sm">Vênus em {chart.venus_sign}</p>
                            <p className="text-cosmic-star font-serif text-lg mt-1">{venusStyle.style}</p>
                          </div>
                          <p className="text-cosmic-text text-sm leading-relaxed mb-4">{venusStyle.description}</p>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white/5 rounded-xl p-3">
                              <p className="text-cosmic-muted text-xs mb-2">🎨 Cores</p>
                              <div className="flex flex-wrap gap-1">
                                {venusStyle.colors.map(c => (
                                  <span key={c} className="text-xs bg-white/10 text-cosmic-text px-2 py-0.5 rounded-full">{c}</span>
                                ))}
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                              <p className="text-cosmic-muted text-xs mb-2">✨ Estética</p>
                              <p className="text-cosmic-text text-xs">{venusStyle.aesthetic}</p>
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 mb-4">
                            <p className="text-cosmic-muted text-xs mb-2">💎 Acessórios</p>
                            <div className="flex flex-wrap gap-1">
                              {venusStyle.accessories.map(a => (
                                <span key={a} className="text-xs bg-cosmic-gold/20 text-cosmic-gold px-2 py-0.5 rounded-full">{a}</span>
                              ))}
                            </div>
                          </div>
                          <button onClick={handleVenusAI} disabled={loadingAI} className="w-full cosmic-button-outline py-2 text-sm flex items-center justify-center gap-2">
                            {loadingAI ? <div className="w-4 h-4 border-2 border-cosmic-accent/30 border-t-cosmic-accent rounded-full animate-spin" /> : <Sparkles size={14} />}
                            Interpretação personalizada
                          </button>
                          {venusAI && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <p className="text-cosmic-text text-sm leading-relaxed">{venusAI}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
