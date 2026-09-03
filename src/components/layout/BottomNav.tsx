import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Map, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const itensNav = [
  { para: '/inicio', icone: Home, rotulo: 'Início' },
  { para: '/chat', icone: MessageCircle, rotulo: 'Perguntar' },
  { para: '/meu-mapa', icone: Map, rotulo: 'Meu Mapa' },
  { para: '/descobrir', icone: Compass, rotulo: 'Descobrir' },
];

export default function NavInferior() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Fundo com blur */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-cosmic-border" />

      <div className="relative flex items-center justify-around max-w-lg mx-auto px-2 bottom-nav-safe pt-2">
        {itensNav.map(({ para, icone: Icone, rotulo }) => {
          const ativo = location.pathname === para;
          return (
            <NavLink
              key={para}
              to={para}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[56px] relative"
            >
              <div className="relative">
                {ativo && (
                  <motion.div
                    layoutId="indicadorNav"
                    className="absolute -inset-2 bg-cosmic-accent/15 rounded-xl border border-cosmic-accent/20"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <Icone
                  size={22}
                  className={`relative z-10 transition-colors duration-200 ${
                    ativo ? 'text-cosmic-purple' : 'text-cosmic-muted'
                  }`}
                  strokeWidth={ativo ? 2.2 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                ativo ? 'text-cosmic-star' : 'text-cosmic-muted'
              }`}>
                {rotulo}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
