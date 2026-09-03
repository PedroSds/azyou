-- Tabela para armazenar mapas astrais de pessoas criadas pelos usuários
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mapas_pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  hora_nascimento TIME,
  cidade_nascimento TEXT,
  latitude_nascimento DOUBLE PRECISION,
  longitude_nascimento DOUBLE PRECISION,
  mapa_calculado JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: apenas o dono da conta pode ver/editar seus mapas
ALTER TABLE mapas_pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seus próprios mapas"
  ON mapas_pessoas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário cria seus próprios mapas"
  ON mapas_pessoas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta seus próprios mapas"
  ON mapas_pessoas FOR DELETE
  USING (auth.uid() = usuario_id);
