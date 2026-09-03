import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { useUserStore } from './stores/userStore';
import { initAstrology } from './services/astrology';

// Páginas
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Chart from './pages/Chart';
import Discover from './pages/Discover';
import Perfil from './pages/Perfil';

// Tela de carregamento
function Carregando() {
  return (
    <div className="min-h-dvh bg-cosmic-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🔮</div>
        <div className="w-8 h-8 border-2 border-cosmic-accent/30 border-t-cosmic-accent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

// Rota protegida
function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { user, profile } = useUserStore();
  if (!user) return <Navigate to="/" replace />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, profile, setUser, setProfile, setChart } = useUserStore();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Initialize Swiss Ephemeris (Placidus houses — same engine as Astro-Seek)
    initAstrology().catch(console.error);

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        carregarPerfil(session.user.id);
      } else {
        setCarregando(false);
      }
    });

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (sessao?.user) {
        setUser(sessao.user);
        carregarPerfil(sessao.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setChart(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const carregarPerfil = async (userId: string) => {
    try {
      // Carregar perfil
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (perfilData) {
        setProfile({
          id: perfilData.id,
          name: perfilData.nome,
          birth_date: perfilData.data_nascimento,
          birth_time: perfilData.hora_nascimento,
          birth_city: perfilData.cidade_nascimento,
          birth_lat: perfilData.latitude_nascimento,
          birth_lon: perfilData.longitude_nascimento,
          interests: perfilData.interesses || [],
          onboarding_complete: perfilData.onboarding_completo,
          ai_context: perfilData.contexto_ia || {},
        });

        // Carregar mapa natal
        const { data: mapaData } = await supabase
          .from('mapas_natais')
          .select('*')
          .eq('usuario_id', userId)
          .single();

        if (mapaData) {
          setChart({
            sun_sign: mapaData.signo_solar,
            sun_degree: mapaData.grau_solar,
            moon_sign: mapaData.signo_lunar,
            moon_degree: mapaData.grau_lunar,
            ascendant: mapaData.ascendente,
            asc_degree: mapaData.grau_ascendente,
            midheaven: mapaData.meio_do_ceu,
            mc_degree: mapaData.grau_mc,
            planets: mapaData.planetas,
            houses: mapaData.casas,
            aspects: mapaData.aspectos,
            venus_sign: mapaData.signo_venus,
            personal_arcanum: mapaData.arcano_pessoal,
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return <Carregando />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to={profile?.onboarding_complete ? '/inicio' : '/onboarding'} replace />
              : <Auth />
          }
        />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            user
              ? (profile?.onboarding_complete ? <Navigate to="/inicio" replace /> : <Onboarding />)
              : <Navigate to="/" replace />
          }
        />

        {/* Rotas protegidas */}
        <Route path="/inicio" element={<RotaProtegida><Home /></RotaProtegida>} />
        <Route path="/home" element={<Navigate to="/inicio" replace />} />
        <Route path="/chat" element={<RotaProtegida><Chat /></RotaProtegida>} />
        <Route path="/meu-mapa" element={<RotaProtegida><Chart /></RotaProtegida>} />
        <Route path="/chart" element={<Navigate to="/meu-mapa" replace />} />
        <Route path="/descobrir" element={<RotaProtegida><Discover /></RotaProtegida>} />
        <Route path="/discover" element={<Navigate to="/descobrir" replace />} />
        <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path="/profile" element={<Navigate to="/perfil" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
