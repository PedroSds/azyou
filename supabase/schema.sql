-- =====================================================
-- AZYOU — Script de criação do banco de dados
-- Execute no painel do Supabase > SQL Editor
-- Todos os nomes estão em português do Brasil
-- =====================================================

-- ─────────────────────────────────────────────
-- 1. TABELA: perfis
-- Armazena dados pessoais e de nascimento do usuário
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfis (
  id                    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome                  TEXT,
  data_nascimento       DATE,
  hora_nascimento       TIME,
  cidade_nascimento     TEXT,
  latitude_nascimento   DOUBLE PRECISION,
  longitude_nascimento  DOUBLE PRECISION,
  interesses            TEXT[] DEFAULT '{}',
  onboarding_completo   BOOLEAN DEFAULT FALSE,
  criado_em             TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. TABELA: mapas_natais
-- Armazena o mapa astral calculado de cada usuário
-- Calculado UMA vez no onboarding e salvo aqui
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mapas_natais (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id        UUID REFERENCES public.perfis(id) ON DELETE CASCADE UNIQUE,
  -- Luminares principais
  signo_solar       TEXT NOT NULL,
  grau_solar        DOUBLE PRECISION,
  signo_lunar       TEXT NOT NULL,
  grau_lunar        DOUBLE PRECISION,
  -- Pontos sensíveis
  ascendente        TEXT,
  grau_ascendente   DOUBLE PRECISION,
  meio_do_ceu       TEXT,
  grau_mc           DOUBLE PRECISION,
  -- Dados completos em JSON
  planetas          JSONB DEFAULT '{}',   -- { mercurio: { signo, grau, casa, retrogrado }, ... }
  casas             JSONB DEFAULT '{}',   -- { "1": { signo, grau }, ... }
  aspectos          JSONB DEFAULT '[]',   -- [{ planeta1, planeta2, tipo, orbe, simbolo }]
  -- Extras
  signo_venus       TEXT,
  arcano_pessoal    INTEGER,
  calculado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. TABELA: cartas_do_dia
-- Registra a carta de tarot diária de cada usuário
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cartas_do_dia (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id          UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  data_carta          DATE NOT NULL,
  nome_carta          TEXT NOT NULL,
  numero_carta        INTEGER NOT NULL,
  significado_carta   TEXT,
  interpretacao_ia    TEXT,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, data_carta)
);

-- ─────────────────────────────────────────────
-- 4. TABELA: mensagens_chat
-- Histórico de conversa com a Astróloga IA (Luna)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensagens_chat (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  papel       TEXT NOT NULL CHECK (papel IN ('usuario', 'assistente')),
  conteudo    TEXT NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. TABELA: compatibilidades
-- Comparações de compatibilidade astrológica salvas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compatibilidades (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id                UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  nome_parceiro             TEXT NOT NULL,
  data_nascimento_parceiro  DATE NOT NULL,
  hora_nascimento_parceiro  TIME,
  cidade_parceiro           TEXT,
  latitude_parceiro         DOUBLE PRECISION,
  longitude_parceiro        DOUBLE PRECISION,
  resultado                 JSONB,   -- { amor, comunicacao, quimica, relacionamento, geral, analise }
  criado_em                 TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário acessa SOMENTE seus próprios dados
-- =====================================================

ALTER TABLE public.perfis              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapas_natais        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartas_do_dia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibilidades    ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- Políticas: perfis
-- ─────────────────────────────────────────────
CREATE POLICY "Usuário lê próprio perfil"
  ON public.perfis FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário cria próprio perfil"
  ON public.perfis FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.perfis FOR UPDATE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────
-- Políticas: mapas_natais
-- ─────────────────────────────────────────────
CREATE POLICY "Usuário lê próprio mapa"
  ON public.mapas_natais FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário cria próprio mapa"
  ON public.mapas_natais FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprio mapa"
  ON public.mapas_natais FOR UPDATE
  USING (auth.uid() = usuario_id);

-- ─────────────────────────────────────────────
-- Políticas: cartas_do_dia
-- ─────────────────────────────────────────────
CREATE POLICY "Usuário lê próprias cartas"
  ON public.cartas_do_dia FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprias cartas"
  ON public.cartas_do_dia FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprias cartas"
  ON public.cartas_do_dia FOR UPDATE
  USING (auth.uid() = usuario_id);

-- ─────────────────────────────────────────────
-- Políticas: mensagens_chat
-- ─────────────────────────────────────────────
CREATE POLICY "Usuário lê próprias mensagens"
  ON public.mensagens_chat FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprias mensagens"
  ON public.mensagens_chat FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprias mensagens"
  ON public.mensagens_chat FOR DELETE
  USING (auth.uid() = usuario_id);

-- ─────────────────────────────────────────────
-- Políticas: compatibilidades
-- ─────────────────────────────────────────────
CREATE POLICY "Usuário lê próprias compatibilidades"
  ON public.compatibilidades FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprias compatibilidades"
  ON public.compatibilidades FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprias compatibilidades"
  ON public.compatibilidades FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- ÍNDICES para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_mapas_natais_usuario     ON public.mapas_natais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cartas_do_dia_usuario    ON public.cartas_do_dia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cartas_do_dia_data       ON public.cartas_do_dia(data_carta);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_usuario   ON public.mensagens_chat(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_criado    ON public.mensagens_chat(criado_em);
CREATE INDEX IF NOT EXISTS idx_compatibilidades_usuario ON public.compatibilidades(usuario_id);

-- =====================================================
-- TRIGGER: atualiza campo atualizado_em em perfis
-- =====================================================
CREATE OR REPLACE FUNCTION public.atualizar_campo_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_perfis_atualizado_em
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_campo_atualizado_em();

-- =====================================================
-- FIM DO SCRIPT
-- Execute no Supabase > SQL Editor e clique em "Run"
-- =====================================================
