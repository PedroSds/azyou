import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../services/supabase';
import CosmicBackground from '../components/layout/CosmicBackground';

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/home');
      } else if (mode === 'register') {
        if (!name.trim()) { setError('Por favor, informe seu nome.'); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Criar perfil inicial
          await supabase.from('perfis').insert({
            id: data.user.id,
            nome: name.trim(),
            onboarding_completo: false,
            interesses: [],
          });
          navigate('/onboarding');
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess('Enviamos um link de recuperação para seu email!');
      }
    } catch (err: any) {
      const msg = err?.message || 'Algo deu errado. Tente novamente.';
      if (msg.includes('Invalid login')) setError('Email ou senha incorretos.');
      else if (msg.includes('already registered')) setError('Este email já está cadastrado.');
      else if (msg.includes('Password')) setError('A senha deve ter no mínimo 6 caracteres.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-cosmic-bg flex items-center justify-center p-4">
      <CosmicBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4 inline-block"
          >
            🔮
          </motion.div>
          <h1 className="font-serif text-4xl font-light gradient-text">azyou</h1>
          <p className="text-cosmic-muted text-sm mt-2 font-light">
            seu universo astrológico pessoal
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 shadow-cosmic">
          {/* Tabs Padronizadas */}
          {mode !== 'forgot' && (
            <div className="flex mb-6 w-full glass-card p-1 rounded-full border-cosmic-border">
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 relative py-2 text-sm rounded-full transition-all duration-200 text-center ${
                    mode === m
                      ? 'text-cosmic-star font-semibold'
                      : 'text-cosmic-muted font-medium hover:text-cosmic-star'
                  }`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="authTabIndicator"
                      className="absolute inset-0 bg-cosmic-accent/20 border border-cosmic-accent/40 rounded-full"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <span className="relative z-10">{m === 'login' ? 'Entrar' : 'Criar conta'}</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <h2 className="font-serif text-xl text-cosmic-star mb-1">Recuperar senha</h2>
              <p className="text-cosmic-muted text-sm">
                Informe seu email e enviaremos um link de recuperação.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-cosmic pl-10"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-cosmic pl-10"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmic-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-cosmic pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cosmic-muted hover:text-cosmic-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2 px-3"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-sm text-center bg-green-500/10 rounded-lg py-2 px-3"
              >
                {success}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cosmic-button w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  {mode === 'login' ? 'Entrar no universo' : mode === 'register' ? 'Criar minha conta' : 'Enviar link'}
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <button
              onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
              className="w-full text-center text-cosmic-muted text-sm mt-4 hover:text-cosmic-text transition-colors"
            >
              Esqueci minha senha
            </button>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full text-center text-cosmic-muted text-sm mt-4 hover:text-cosmic-text transition-colors"
            >
              ← Voltar ao login
            </button>
          )}
        </div>

        <p className="text-center text-cosmic-muted text-xs mt-6">
          Ao criar uma conta, você concorda com nossa{' '}
          <span className="text-cosmic-lilac">política de privacidade</span>
        </p>
      </motion.div>
    </div>
  );
}
