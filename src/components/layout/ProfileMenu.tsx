import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../stores/userStore';

export default function ProfileMenu() {
  const { user, profile, reset } = useUserStore();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aoClicarFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);


  const sair = async () => {
    setAberto(false);
    await supabase.auth.signOut();
    reset();
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto(!aberto)}
        aria-label="Menu"
        className="p-2 rounded-full hover:bg-white/10 text-cosmic-star transition-all duration-200 active:scale-95"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-56 glass-card shadow-lg border-cosmic-border overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-semibold text-cosmic-star truncate">
                {profile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-cosmic-muted truncate">
                {user?.email}
              </p>
            </div>

            <button
              onClick={() => { setAberto(false); navigate('/perfil'); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-cosmic-text hover:bg-white/5 transition-colors"
            >
              <Settings size={16} className="text-cosmic-accent" />
              Configurações
            </button>

            <button
              onClick={sair}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/10"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}