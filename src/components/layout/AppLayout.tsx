import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import NavInferior from './BottomNav';
import CosmicBackground from './CosmicBackground';

interface AppLayoutProps {
  children: React.ReactNode;
  mostrarNav?: boolean;
}

export default function AppLayout({ children, mostrarNav = true }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="relative min-h-dvh bg-cosmic-bg overflow-x-hidden">
      <CosmicBackground />
      <div className="relative z-10 min-h-dvh flex flex-col">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`flex-1 w-full max-w-lg mx-auto px-4 ${mostrarNav ? 'pb-24' : ''}`}
          >
            {children}
          </motion.main>
        </AnimatePresence>
        {mostrarNav && <NavInferior />}
      </div>
    </div>
  );
}
