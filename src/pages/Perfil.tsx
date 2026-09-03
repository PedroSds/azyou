import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Heart, LogOut, RefreshCw, ChevronRight, Check, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useUserStore } from '../stores/userStore';
import { calculateBirthChart } from '../services/astrology';
import { searchCities, type CityResult } from '../services/geocoding';
import AppLayout from '../components/layout/AppLayout';

const INTERESSES = [
  { id: 'love', emoji: '❤️', label: 'Amor e relacionamentos' },
  { id: 'money', emoji: '💰', label: 'Dinheiro' },
  { id: 'career', emoji: '💼', label: 'Carreira' },
  { id: 'self', emoji: '🧠', label: 'Autoconhecimento' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Família' },
  { id: 'spiritual', emoji: '✨', label: 'Espiritualidade' },
];

export default function Perfil() {
  const { user, profile, chart, setProfile, setChart, reset } = useUserStore();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(profile?.name || '');
  const [dataNasc, setDataNasc] = useState({ dia: '', mes: '', ano: '' });
  const [horaNasc, setHoraNasc] = useState(profile?.birth_time || '');
  const [semHora, setSemHora] = useState(!profile?.birth_time);
  const [cidadeQuery, setCidadeQuery] = useState(profile?.birth_city || '');
  const [cidadeResultados, setCidadeResultados] = useState<CityResult[]>([]);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<CityResult | null>(null);
  const [interesses, setInteresses] = useState<string[]>(profile?.interests || []);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (profile?.birth_date) {
      const [ano, mes, dia] = profile.birth_date.split('-');
      setDataNasc({ dia, mes, ano });
    }
  }, [profile]);

  const buscarCidade = async (query: string) => {
    setCidadeQuery(query);
    setCidadeSelecionada(null);
    if (query.length < 2) { setCidadeResultados([]); return; }
    const resultados = await searchCities(query);
    setCidadeResultados(resultados);
  };

  const alternarInteresse = (id: string) => {
    setInteresses(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const salvarPerfil = async () => {
    if (!user || !profile) return;
    setSalvando(true);

    const dataStr = `${dataNasc.ano}-${dataNasc.mes.padStart(2, '0')}-${dataNasc.dia.padStart(2, '0')}`;
    const dadosMudaram = dataStr !== profile.birth_date ||
      horaNasc !== profile.birth_time ||
      cidadeSelecionada !== null;

    const cidadeFinal = cidadeSelecionada || {
      lat: profile.birth_lat,
      lon: profile.birth_lon,
      displayName: profile.birth_city,
    };

    await supabase.from('perfis').upsert({
      id: user.id,
      nome,
      data_nascimento: dataStr,
      hora_nascimento: semHora ? null : (horaNasc || null),
      cidade_nascimento: cidadeFinal.displayName || '',
      latitude_nascimento: cidadeFinal.lat || null,
      longitude_nascimento: cidadeFinal.lon || null,
      interesses,
      onboarding_completo: true,
    });

    if (dadosMudaram) {
      const novoMapa = calculateBirthChart({
        birthDate: dataStr,
        birthTime: semHora ? undefined : (horaNasc || undefined),
        lat: cidadeFinal.lat || 0,
        lon: cidadeFinal.lon || 0,
      }, dataStr);

      await supabase.from('mapas_natais').upsert({
        id: user.id,
        usuario_id: user.id,
        signo_solar: novoMapa.sun.sign,
        grau_solar: novoMapa.sun.degree,
        signo_lunar: novoMapa.moon.sign,
        grau_lunar: novoMapa.moon.degree,
        ascendente: novoMapa.ascendant?.sign || null,
        grau_ascendente: novoMapa.ascendant?.degree || null,
        meio_do_ceu: novoMapa.midheaven?.sign || null,
        grau_mc: novoMapa.midheaven?.degree || null,
        planetas: novoMapa.planets,
        casas: novoMapa.houses,
        aspectos: novoMapa.aspects,
        signo_venus: novoMapa.venus_sign,
        arcano_pessoal: novoMapa.personal_arcanum,
        calculado_em: new Date().toISOString(),
      });

      setChart({
        sun_sign: novoMapa.sun.sign,
        sun_degree: novoMapa.sun.degree,
        moon_sign: novoMapa.moon.sign,
        moon_degree: novoMapa.moon.degree,
        ascendant: novoMapa.ascendant?.sign,
        asc_degree: novoMapa.ascendant?.degree,
        midheaven: novoMapa.midheaven?.sign,
        mc_degree: novoMapa.midheaven?.degree,
        planets: novoMapa.planets,
        houses: novoMapa.houses,
        aspects: novoMapa.aspects,
        venus_sign: novoMapa.venus_sign,
        personal_arcanum: novoMapa.personal_arcanum,
      });

      // Limpar cache do horóscopo
      Object.keys(localStorage).filter(k => k.startsWith('azyou-horoscope')).forEach(k => localStorage.removeItem(k));
    }

    setProfile({
      id: user.id,
      name: nome,
      birth_date: dataStr,
      birth_time: semHora ? undefined : horaNasc,
      birth_city: cidadeFinal.displayName || '',
      birth_lat: cidadeFinal.lat || 0,
      birth_lon: cidadeFinal.lon || 0,
      interests: interesses,
      onboarding_complete: true,
    });

    setSalvando(false);
    setSucesso(true);
    setEditando(false);
    setTimeout(() => setSucesso(false), 3000);
  };

  const sair = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/');
  };

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  if (!profile) return null;

  return (
    <AppLayout>
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-sans text-xs font-bold uppercase tracking-widest text-cosmic-star">PERFIL</h1>
          <button
            onClick={() => setEditando(!editando)}
            className="flex items-center gap-2 text-cosmic-lilac text-sm hover:text-cosmic-violet transition-colors"
          >
            <Edit3 size={15} />
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {/* Avatar + Info */}
        <motion.div
          layout
          className="glass-card p-5 mb-6 text-center border border-cosmic-accent/20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="w-[75px] h-[75px] rounded-2xl bg-cosmic-accent/20 border-2 border-cosmic-accent/40 flex items-center justify-center font-bold text-3xl text-cosmic-star mx-auto mb-3">
            {profile.name?.trim().charAt(0).toUpperCase() || '👤'}
          </div>
          <h2 className="font-sans text-2xl font-bold text-cosmic-star">{profile.name}</h2>
          {chart && (
            <p className="text-cosmic-muted text-sm mt-1">
              ☀️ {chart.sun_sign}
              {chart.moon_sign && ` · 🌙 ${chart.moon_sign}`}
              {chart.ascendant && ` · ⬆️ ${chart.ascendant}`}
            </p>
          )}
        </motion.div>

        {sucesso && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card p-3 mb-4 border border-green-500/30 flex items-center gap-2"
          >
            <Check size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">Perfil atualizado com sucesso!</span>
          </motion.div>
        )}

        {!editando ? (
          /* Modo visualização */
          <div className="space-y-3">
            {[
              { icon: User, label: 'Nome', value: profile.name },
              { icon: Calendar, label: 'Data de nascimento', value: profile.birth_date ? new Date(profile.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
              { icon: Clock, label: 'Hora de nascimento', value: profile.birth_time || 'Não informada' },
              { icon: MapPin, label: 'Cidade de nascimento', value: profile.birth_city || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-card p-4 flex items-center gap-3">
                <Icon size={18} className="text-cosmic-accent shrink-0" />
                <div>
                  <p className="text-cosmic-muted text-xs">{label}</p>
                  <p className="text-cosmic-star text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}

            {/* Interesses */}
            <div className="glass-card p-4">
              <p className="text-cosmic-muted text-xs mb-3 flex items-center gap-1">
                <Heart size={13} /> Meus interesses
              </p>
              {profile.interests && profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {INTERESSES.filter(i => profile.interests?.includes(i.id)).map(({ emoji, label }) => (
                    <span key={label} className="text-xs bg-cosmic-accent/20 text-cosmic-lilac px-3 py-1 rounded-full">
                      {emoji} {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-cosmic-muted text-sm">Nenhum interesse selecionado</p>
              )}
            </div>
          </div>
        ) : (
          /* Modo edição */
          <div className="space-y-4">
            <div>
              <label className="text-cosmic-muted text-xs mb-1 block">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="input-cosmic"
              />
            </div>

            <div>
              <label className="text-cosmic-muted text-xs mb-1 block">Data de nascimento</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={dataNasc.dia} onChange={e => setDataNasc(p => ({...p, dia: e.target.value}))} className="input-cosmic text-center text-sm">
                  <option value="">Dia</option>
                  {Array.from({length:31},(_,i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{i+1}</option>)}
                </select>
                <select value={dataNasc.mes} onChange={e => setDataNasc(p => ({...p, mes: e.target.value}))} className="input-cosmic text-center text-sm">
                  <option value="">Mês</option>
                  {meses.map((m,i) => <option key={i+1} value={String(i+1).padStart(2,'0')}>{m}</option>)}
                </select>
                <select value={dataNasc.ano} onChange={e => setDataNasc(p => ({...p, ano: e.target.value}))} className="input-cosmic text-center text-sm">
                  <option value="">Ano</option>
                  {Array.from({length:100},(_,i) => <option key={2006-i} value={String(2006-i)}>{2006-i}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-cosmic-muted text-xs mb-1 block">Hora de nascimento</label>
              {!semHora && (
                <input type="time" value={horaNasc} onChange={e => setHoraNasc(e.target.value)} className="input-cosmic mb-2" />
              )}
              <button onClick={() => setSemHora(!semHora)}
                className={`w-full py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${semHora ? 'border-cosmic-accent bg-cosmic-accent/20 text-cosmic-lilac' : 'border-white/15 text-cosmic-muted'}`}>
                {semHora ? '✓ ' : ''}Não sei minha hora de nascimento
              </button>
            </div>

            <div>
              <label className="text-cosmic-muted text-xs mb-1 block">Cidade de nascimento</label>
              <input type="text" placeholder="Buscar cidade..." value={cidadeQuery}
                onChange={e => buscarCidade(e.target.value)} className="input-cosmic" />
              {cidadeResultados.length > 0 && !cidadeSelecionada && (
                <div className="glass-card overflow-hidden mt-1">
                  {cidadeResultados.slice(0, 4).map((cidade, i) => (
                    <button key={i} onClick={() => { setCidadeSelecionada(cidade); setCidadeQuery(cidade.displayName); setCidadeResultados([]); }}
                      className="w-full text-left px-3 py-2 text-sm text-cosmic-text hover:bg-white/5 border-b border-white/5 last:border-0">
                      {cidade.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-cosmic-muted text-xs mb-2 block">Interesses</label>
              <div className="grid grid-cols-2 gap-2">
                {INTERESSES.map(({ id, emoji, label }) => (
                  <button key={id} onClick={() => alternarInteresse(id)}
                    className={`glass-card p-2.5 flex items-center gap-2 text-left transition-all ${interesses.includes(id) ? 'tab-active' : 'hover:border-white/25'}`}>
                    <span>{emoji}</span>
                    <span className="text-cosmic-text text-xs">{label}</span>
                    {interesses.includes(id) && <Check size={11} className="text-cosmic-lilac ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={salvarPerfil}
              disabled={salvando}
              className="cosmic-button w-full flex items-center justify-center gap-2"
            >
              {salvando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}

        {/* Gerenciar conta */}
        <div className="mt-8 space-y-3">
          <h3 className="text-cosmic-muted text-xs font-semibold uppercase tracking-wider">Conta</h3>
          <button
            onClick={sair}
            className="w-full glass-card p-4 flex items-center gap-3 text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>

        <p className="text-center text-cosmic-muted text-xs mt-8 pb-4">
          azyou v1.0 · Feito com ✨ e 🔮
        </p>
      </div>
    </AppLayout>
  );
}
