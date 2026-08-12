-- ============================================================
-- PapaApp - Schema Supabase v2 (settings + items)
-- ATTENTION : ce script SUPPRIME les anciennes tables (on repart
-- de zéro côté cloud ; le localStorage reste la source de vérité).
-- À coller dans Supabase > SQL Editor et exécuter.
-- ============================================================

DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS vaccines CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS growth CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- 1. Réglages + routines (1 ligne par utilisateur)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE DEFAULT auth.uid(),
  name text DEFAULT '',
  child_name text DEFAULT '',
  child_birth_date date,
  first_sunday_date date,
  sunday_interval int DEFAULT 14,
  first_sunday_note text DEFAULT '',
  checklists jsonb DEFAULT '{}',
  school jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- 2. Toutes les listes (RDV, vaccins, dépenses, documents, école, etc.)
CREATE TABLE IF NOT EXISTS items (
  id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  type text NOT NULL,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own data only" ON settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own data only" ON items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_items_user_type ON items(user_id, type);
