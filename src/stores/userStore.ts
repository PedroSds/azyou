import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { PlanetaData as PlanetData, CasaData as HouseData, AspectoData as AspectData } from '../services/supabase';

export interface UserProfile {
  id: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_city: string;
  birth_lat: number;
  birth_lon: number;
  interests: string[];
  onboarding_complete: boolean;
  ai_context?: Record<string, any>; // Semantic memory for Azy
}

export interface BirthChart {
  sun_sign: string;
  sun_degree: number;
  moon_sign: string;
  moon_degree: number;
  ascendant?: string;
  asc_degree?: number;
  midheaven?: string;
  mc_degree?: number;
  planets: Record<string, PlanetData>;
  houses: Record<string, HouseData>;
  aspects: AspectData[];
  venus_sign: string;
  personal_arcanum: number;
}

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  chart: BirthChart | null;
  currentSessionId: string | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setChart: (chart: BirthChart | null) => void;
  setSessionId: (id: string | null) => void;
  updateAiContext: (ctx: Record<string, any>) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      chart: null,
      currentSessionId: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setChart: (chart) => set({ chart }),
      setSessionId: (id) => set({ currentSessionId: id }),
      updateAiContext: (ctx) => set(state => ({
        profile: state.profile ? { ...state.profile, ai_context: { ...(state.profile.ai_context || {}), ...ctx } } : null
      })),
      reset: () => set({ user: null, profile: null, chart: null, currentSessionId: null }),
    }),
    {
      name: 'azyou-user-store',
      partialize: (state) => ({
        profile: state.profile,
        chart: state.chart,
      }),
    }
  )
);
