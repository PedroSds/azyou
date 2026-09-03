import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Clock, ChevronRight, Star, Sparkles, Check } from 'lucide-react';
import { supabase } from '../services/supabase';
import { searchCities, type CityResult } from '../services/geocoding';
import { calculateBirthChart } from '../services/astrology';
import { useUserStore } from '../stores/userStore';
import CosmicBackground from '../components/layout/CosmicBackground';

const INTERESTS = [
  { id: 'love', emoji: '❤️', label: 'Amor e relacionamentos' },
  { id: 'money', emoji: '💰', label: 'Dinheiro' },
  { id: 'career', emoji: '💼', label: 'Carreira' },
  { id: 'self', emoji: '🧠', label: 'Autoconhecimento' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Família' },
  { id: 'spiritual', emoji: '✨', label: 'Espiritualidade' },
];

type Step = 'name' | 'birthdate' | 'birthtime' | 'city' | 'interests' | 'loading' | 'result';

export default function Onboarding() {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [birthTime, setBirthTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [chart, setChart] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const navigate = useNavigate();
  const { setProfile, setChart: storeSetChart } = useUserStore();

  const steps: Step[] = ['name', 'birthdate', 'birthtime', 'city', 'interests', 'loading', 'result'];
  const currentIndex = steps.indexOf(step);
  const progress = currentIndex / (steps.length - 2); // don't count loading/result

  // City search debounce
  useEffect(() => {
    if (cityQuery.length < 2) { setCityResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchCities(cityQuery);
      setCityResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const computeChart = useCallback(async () => {
    setStep('loading');
    const messages = [
      '🔮 Mapeando os astros no momento do seu nascimento...',
      '✨ Calculando posições planetárias...',
      '🌙 Determinando sua Lua e Ascendente...',
      '⭐ Identificando aspectos do seu mapa...',
      '🪐 Finalizando seu perfil astrológico...',
    ];

    let i = 0;
    const interval = setInterval(() => {
      setLoadingMsg(messages[i % messages.length]);
      i++;
    }, 1200);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const dateStr = `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
      const calculatedChart = calculateBirthChart({
        birthDate: dateStr,
        birthTime: noTime ? undefined : birthTime || undefined,
        lat: selectedCity?.lat || 0,
        lon: selectedCity?.lon || 0,
        timezone: selectedCity?.timezone || undefined,
      }, dateStr);

      // Salvar perfil
      await supabase.from('perfis').upsert({
        id: user.id,
        nome: name,
        data_nascimento: dateStr,
        hora_nascimento: noTime ? null : (birthTime || null),
        cidade_nascimento: selectedCity?.displayName || '',
        latitude_nascimento: selectedCity?.lat || null,
        longitude_nascimento: selectedCity?.lon || null,
        interesses: interests,
        onboarding_completo: true,
      });

      // Salvar mapa natal
      await supabase.from('mapas_natais').upsert({
        id: user.id,
        usuario_id: user.id,
        signo_solar: calculatedChart.sun.sign,
        grau_solar: calculatedChart.sun.degree,
        signo_lunar: calculatedChart.moon.sign,
        grau_lunar: calculatedChart.moon.degree,
        ascendente: calculatedChart.ascendant?.sign || null,
        grau_ascendente: calculatedChart.ascendant?.degree || null,
        meio_do_ceu: calculatedChart.midheaven?.sign || null,
        grau_mc: calculatedChart.midheaven?.degree || null,
        planetas: calculatedChart.planets,
        casas: calculatedChart.houses,
        aspectos: calculatedChart.aspects,
        signo_venus: calculatedChart.venus_sign,
        arcano_pessoal: calculatedChart.personal_arcanum,
        calculado_em: new Date().toISOString(),
      });

      // Update store
      setProfile({
        id: user.id,
        name,
        birth_date: dateStr,
        birth_time: noTime ? undefined : birthTime,
        birth_city: selectedCity?.displayName || '',
        birth_lat: selectedCity?.lat || 0,
        birth_lon: selectedCity?.lon || 0,
        interests,
        onboarding_complete: true,
      });

      storeSetChart({
        sun_sign: calculatedChart.sun.sign,
        sun_degree: calculatedChart.sun.degree,
        moon_sign: calculatedChart.moon.sign,
        moon_degree: calculatedChart.moon.degree,
        ascendant: calculatedChart.ascendant?.sign,
        asc_degree: calculatedChart.ascendant?.degree,
        midheaven: calculatedChart.midheaven?.sign,
        mc_degree: calculatedChart.midheaven?.degree,
        planets: calculatedChart.planets,
        houses: calculatedChart.houses,
        aspects: calculatedChart.aspects,
        venus_sign: calculatedChart.venus_sign,
        personal_arcanum: calculatedChart.personal_arcanum,
      });

      setChart(calculatedChart);
      clearInterval(interval);
      setTimeout(() => setStep('result'), 500);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setLoadingMsg('Erro ao calcular mapa. Tentando novamente...');
    }
  }, [birthDate, birthTime, noTime, selectedCity, name, interests]);

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="relative min-h-dvh bg-cosmic-bg flex flex-col">
      <CosmicBackground />

      {/* Progress bar */}
      {!['loading', 'result'].includes(step) && (
        <div className="relative z-10 px-6 pt-safe pt-8">
          <div className="w-full bg-white/10 rounded-full h-1">
            <motion.div
              className="bg-gradient-to-r from-cosmic-accent to-cosmic-lilac h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-cosmic-muted text-xs mt-2 text-right">
            {Math.round(progress * 100)}% concluído
          </p>
        </div>
      )}

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {/* STEP: NAME */}
            {step === 'name' && (
              <motion.div key="name" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">✨</div>
                  <h2 className="font-serif text-3xl text-cosmic-star mb-3">Como podemos<br />te chamar?</h2>
                  <p className="text-cosmic-muted text-sm">Vamos personalizar sua experiência astrológica</p>
                </div>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep('birthdate')}
                  className="input-cosmic text-center text-lg mb-6"
                  autoFocus
                />
                <button
                  onClick={() => name.trim() && setStep('birthdate')}
                  disabled={!name.trim()}
                  className="cosmic-button w-full flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP: BIRTHDATE */}
            {step === 'birthdate' && (
              <motion.div key="birthdate" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🌟</div>
                  <h2 className="font-cursive text-4xl text-cosmic-star mb-3">
                    Olá, {name}!<br />Quando você nasceu?
                  </h2>
                  <p className="text-cosmic-muted text-sm">Sua data de nascimento revela seu signo solar</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <select
                    value={birthDate.day}
                    onChange={(e) => setBirthDate(p => ({...p, day: e.target.value}))}
                    className="input-cosmic text-center"
                  >
                    <option value="">Dia</option>
                    {Array.from({length:31},(_,i)=>(
                      <option key={i+1} value={String(i+1)}>{i+1}</option>
                    ))}
                  </select>
                  <select
                    value={birthDate.month}
                    onChange={(e) => setBirthDate(p => ({...p, month: e.target.value}))}
                    className="input-cosmic text-center"
                  >
                    <option value="">Mês</option>
                    {months.map((m,i) => (
                      <option key={i+1} value={String(i+1)}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={birthDate.year}
                    onChange={(e) => setBirthDate(p => ({...p, year: e.target.value}))}
                    className="input-cosmic text-center"
                  >
                    <option value="">Ano</option>
                    {Array.from({length:100},(_,i)=>(
                      <option key={2006-i} value={String(2006-i)}>{2006-i}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => birthDate.day && birthDate.month && birthDate.year && setStep('birthtime')}
                  disabled={!birthDate.day || !birthDate.month || !birthDate.year}
                  className="cosmic-button w-full flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP: BIRTHTIME */}
            {step === 'birthtime' && (
              <motion.div key="birthtime" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🌙</div>
                  <h2 className="font-serif text-3xl text-cosmic-star mb-3">Você sabe a hora<br />em que nasceu?</h2>
                  <p className="text-cosmic-muted text-sm">
                    A hora de nascimento é essencial para calcular seu Ascendente e as Casas do seu mapa astral.
                  </p>
                </div>
                {!noTime && (
                  <div className="relative mb-4">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
                    <input
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className="input-cosmic pl-10 text-center"
                    />
                  </div>
                )}
                <button
                  onClick={() => setNoTime(!noTime)}
                  className={`w-full py-3 rounded-xl border text-sm font-medium transition-all duration-200 mb-6 ${
                    noTime
                      ? 'border-cosmic-accent bg-cosmic-accent/20 text-cosmic-lilac'
                      : 'border-white/15 text-cosmic-muted hover:border-white/30'
                  }`}
                >
                  {noTime ? '✓ ' : ''}Não sei minha hora de nascimento
                </button>
                {noTime && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-cosmic-muted text-xs text-center mb-4 bg-white/5 rounded-lg p-3"
                  >
                    ℹ️ Sem a hora exata, o Ascendente e as Casas não serão calculados, mas todos os outros dados do seu mapa estarão disponíveis.
                  </motion.p>
                )}
                <button
                  onClick={() => setStep('city')}
                  disabled={!noTime && !birthTime}
                  className="cosmic-button w-full flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={18} />
                </button>
                <button onClick={() => setStep('birthdate')} className="w-full text-cosmic-muted text-sm mt-3 hover:text-cosmic-text transition-colors">
                  ← Voltar
                </button>
              </motion.div>
            )}

            {/* STEP: CITY */}
            {step === 'city' && (
              <motion.div key="city" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🌍</div>
                  <h2 className="font-serif text-3xl text-cosmic-star mb-3">Em qual cidade<br />você nasceu?</h2>
                  <p className="text-cosmic-muted text-sm">As coordenadas geográficas permitem cálculos astrológicos precisos</p>
                </div>
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
                  <input
                    type="text"
                    placeholder="Buscar cidade..."
                    value={cityQuery}
                    onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); }}
                    className="input-cosmic pl-10"
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-cosmic-accent/30 border-t-cosmic-accent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {selectedCity && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-3 mb-4 border border-cosmic-accent/30"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-cosmic-accent shrink-0" />
                      <span className="text-cosmic-star text-sm">{selectedCity.displayName}</span>
                      <Check size={14} className="text-green-400 ml-auto shrink-0" />
                    </div>
                  </motion.div>
                )}

                {cityResults.length > 0 && !selectedCity && (
                  <div className="glass-card overflow-hidden mb-4">
                    {cityResults.map((city, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedCity(city); setCityQuery(city.displayName); setCityResults([]); }}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-cosmic-border last:border-0"
                      >
                        <MapPin size={14} className="text-cosmic-muted shrink-0" />
                        <div>
                          <p className="text-cosmic-star text-sm">{city.name}</p>
                          <p className="text-cosmic-muted text-xs">{[city.admin1, city.country].filter(Boolean).join(', ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setStep('interests')}
                  disabled={!selectedCity}
                  className="cosmic-button w-full flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={18} />
                </button>
                <button onClick={() => setStep('birthtime')} className="w-full text-cosmic-muted text-sm mt-3 hover:text-cosmic-text transition-colors">
                  ← Voltar
                </button>
              </motion.div>
            )}

            {/* STEP: INTERESTS */}
            {step === 'interests' && (
              <motion.div key="interests" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">💫</div>
                  <h2 className="font-serif text-3xl text-cosmic-star mb-3">Sobre o que você<br />mais quer aprender?</h2>
                  <p className="text-cosmic-muted text-sm">Selecionaremos conteúdos personalizados para você</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {INTERESTS.map(({ id, emoji, label }) => (
                    <button
                      key={id}
                      onClick={() => toggleInterest(id)}
                      className={`glass-card p-3 text-left flex items-center gap-2 transition-all duration-200 ${
                        interests.includes(id)
                          ? 'border-cosmic-accent/60 bg-cosmic-accent/15'
                          : 'hover:border-cosmic-purple'
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-cosmic-text text-xs font-medium leading-tight">{label}</span>
                      {interests.includes(id) && (
                        <Check size={12} className="text-cosmic-lilac ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={computeChart}
                  className="gold-button w-full flex items-center justify-center gap-2"
                >
                  <Star size={18} />
                  Criar meu mapa astral
                </button>
                <button onClick={() => setStep('city')} className="w-full text-cosmic-muted text-sm mt-3 hover:text-cosmic-text transition-colors">
                  ← Voltar
                </button>
              </motion.div>
            )}

            {/* STEP: LOADING */}
            {step === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="text-7xl mb-8 inline-block"
                >
                  🔮
                </motion.div>
                <h2 className="font-serif text-3xl text-cosmic-star mb-4">Criando seu perfil<br />astrológico...</h2>
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-cosmic-accent/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-cosmic-accent rounded-full animate-spin" />
                  <div className="absolute inset-2 border-4 border-transparent border-t-cosmic-lilac/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <motion.p
                  key={loadingMsg}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-cosmic-muted text-sm"
                >
                  {loadingMsg}
                </motion.p>
              </motion.div>
            )}

            {/* STEP: RESULT */}
            {step === 'result' && chart && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                  className="text-6xl mb-6"
                >
                  ✨
                </motion.div>
                <h2 className="font-serif text-3xl text-cosmic-star mb-2">Seu perfil está pronto!</h2>
                <p className="text-cosmic-muted text-sm mb-8">Bem-vindo(a) ao seu universo pessoal, {name} 🌌</p>

                <div className="space-y-3 mb-8">
                  {[
                    { emoji: '☀️', label: 'Seu Sol', value: chart.sun.sign },
                    { emoji: '🌙', label: 'Sua Lua', value: chart.moon.sign },
                    chart.ascendant && { emoji: '⬆️', label: 'Seu Ascendente', value: chart.ascendant.sign },
                  ].filter(Boolean).map((item: any, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                      className="glass-card p-4 flex items-center gap-4"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="text-left">
                        <p className="text-cosmic-muted text-xs">{item.label}</p>
                        <p className="text-cosmic-star font-semibold">{item.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  onClick={() => navigate('/home')}
                  className="gold-button w-full flex items-center justify-center gap-2 text-base"
                >
                  <Sparkles size={20} />
                  Entrar no meu universo 🔮
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
