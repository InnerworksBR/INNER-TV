-- Migração: adiciona campo radio_url na tabela tvs
-- Permite configurar uma URL de stream de rádio web por terminal

ALTER TABLE tvs ADD COLUMN IF NOT EXISTS radio_url TEXT DEFAULT NULL;
