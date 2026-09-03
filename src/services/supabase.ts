import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://btllmsrugtboljrjqphr.supabase.co';
const supabaseAnonKey = 'sb_publishable_mAVU0bUAdTSCY9_IfXXqGw_XmSSIeIR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// =====================
// Tipos do banco de dados (PT-BR)
// =====================

export interface PlanetaData {
  signo?: string;
  grau?: number;
  casa?: number;
  retrogrado?: boolean;
  // compatibilidade com código legado
  sign?: string;
  degree?: number;
  house?: number;
  retrograde?: boolean;
}

export interface CasaData {
  signo?: string;
  grau?: number;
  sign?: string;
  degree?: number;
}

export interface AspectoData {
  planeta1?: string;
  planeta2?: string;
  tipo?: string;
  orbe?: number;
  simbolo?: string;
  // compatibilidade com código legado
  planet1?: string;
  planet2?: string;
  type?: string;
  orb?: number;
  symbol?: string;
}

export interface ResultadoCompatibilidade {
  amor: number;
  comunicacao: number;
  quimica: number;
  relacionamento: number;
  geral: number;
  analise: string;
  // compatibilidade
  love?: number;
  communication?: number;
  chemistry?: number;
  relationship?: number;
  overall?: number;
  analysis?: string;
}
