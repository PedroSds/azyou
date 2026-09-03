import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import ProfileMenu from '../components/layout/ProfileMenu';
import DailyHoroscope from '../components/home/DailyHoroscope';
import DailyCard from '../components/home/DailyCard';
import SinastryHome from '../components/home/SinastryHome';
import MapCreator from '../components/home/MapCreator';
import { useUserStore } from '../stores/userStore';
import { getMoonPhase } from '../services/astrology';

const HOME_TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'sinastria', label: 'Sinastria' },
  { id: 'mapas', label: 'Criar Mapa' },
];

export default function Home() {
  const { profile } = useUserStore();
  const [activeTab, setActiveTab] = useState<string>('hoje');
  const [tempMap, setTempMap] = useState<any>(null);
  const moonPhase = getMoonPhase();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleMapCreated = (map: any) => {
    // If no id, it's a temp map — forward to sinastria
    if (!map.id) {
      setTempMap(map);
      setActiveTab('sinastria');
    } else {
      // saved map: just switch to sinastria
      setActiveTab('sinastria');
    }
  };

  return (
    <AppLayout>
      <div className="py-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <div
                  className="w-[75px] h-[75px] rounded-2xl bg-cosmic-accent/20 border-2 border-cosmic-accent/40 flex items-center justify-center font-bold text-3xl text-cosmic-star"
                >
                  {profile?.name?.trim().charAt(0).toUpperCase() || '👤'}
                </div>
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-sm text-cosmic-muted capitalize">{today}</p>
                <h1 className="font-cursive text-4xl text-cosmic-star mt-0.5 truncate">
                  Olá, {profile?.name}!
                </h1>
              </div>
            </div>
            <div className="shrink-0">
              <ProfileMenu />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg">{moonPhase.emoji}</span>
            <span className="text-xs text-cosmic-muted">
              {moonPhase.phase} · {moonPhase.illumination}% iluminada
            </span>
          </div>
        </div>

        {/* Menu de Abas */}
        <div className="flex mb-6 w-full">
          <div className="glass-card flex w-full p-1 rounded-full border-cosmic-border overflow-x-auto scrollbar-none">
            {HOME_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 relative py-2 text-sm rounded-full transition-all duration-200 whitespace-nowrap text-center min-w-[80px] ${
                  activeTab === tab.id
                    ? 'text-cosmic-star font-semibold'
                    : 'text-cosmic-muted font-medium hover:text-cosmic-star'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="homeTabIndicator"
                    className="absolute inset-0 bg-cosmic-accent/20 border border-cosmic-accent/40 rounded-full"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'hoje' && <DailyHoroscope hideHeader />}
            {activeTab === 'tarot' && <DailyCard hideTitle />}
            {activeTab === 'sinastria' && <SinastryHome tempMap={tempMap} />}
            {activeTab === 'mapas' && <MapCreator onMapCreated={handleMapCreated} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
