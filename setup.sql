-- Drop triggers first (in reverse order to avoid dependencies)
DROP TRIGGER IF EXISTS update_character_consumables_timestamp ON character_consumables;
DROP TRIGGER IF EXISTS update_character_combat_stats_timestamp ON character_combat_stats;
DROP TRIGGER IF EXISTS update_character_known_spells_timestamp ON character_known_spells;
DROP TRIGGER IF EXISTS update_character_spell_slots_timestamp ON character_spell_slots;
DROP TRIGGER IF EXISTS update_character_skills_timestamp ON character_skills;
DROP TRIGGER IF EXISTS update_character_buffs_timestamp ON character_buffs;
DROP TRIGGER IF EXISTS update_characters_timestamp ON characters;
DROP TRIGGER IF EXISTS update_character_attributes_timestamp ON character_attributes;

-- Drop the update timestamp function
-- DROP FUNCTION IF EXISTS update_timestamp;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS character_consumables CASCADE;
DROP TABLE IF EXISTS character_combat_stats CASCADE;
DROP TABLE IF EXISTS character_known_spells CASCADE;
DROP TABLE IF EXISTS character_spell_slots CASCADE;
DROP TABLE IF EXISTS character_skills CASCADE;
DROP TABLE IF EXISTS character_buffs CASCADE;
DROP TABLE IF EXISTS character_attributes CASCADE;
DROP TABLE IF EXISTS characters CASCADE;

-- Add these to the DROP TRIGGER section at the top:
DROP TRIGGER IF EXISTS update_character_abp_bonuses_timestamp ON character_abp_bonuses;
DROP TRIGGER IF EXISTS update_character_equipment_timestamp ON character_equipment;
DROP TRIGGER IF EXISTS update_character_class_features_timestamp ON character_class_features;
DROP TRIGGER IF EXISTS update_character_discoveries_timestamp ON character_discoveries;
DROP TRIGGER IF EXISTS update_character_feats_timestamp ON character_feats;

-- Add these to the DROP TABLE section:
DROP TABLE IF EXISTS character_abp_bonuses;
DROP TABLE IF EXISTS character_equipment;
DROP TABLE IF EXISTS character_class_features;
DROP TABLE IF EXISTS character_discoveries;
DROP TABLE IF EXISTS character_feats;

-- Drop extension if it was created for UUID support
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Supabase AI is experimental and may produce incorrect answers
-- Always verify the output before executing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Base character table with Supabase-specific columns
CREATE TABLE
  characters (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users (id),
    NAME TEXT NOT NULL,
    CLASS TEXT NOT NULL,
    race TEXT NOT NULL,
    LEVEL INTEGER NOT NULL,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_offline BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
  );

-- Attributes tracking with sync support
CREATE TABLE
  character_attributes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    str INTEGER NOT NULL,
    dex INTEGER NOT NULL,
    con INTEGER NOT NULL,
    INT INTEGER NOT NULL,
    wis INTEGER NOT NULL,
    cha INTEGER NOT NULL,
    is_temporary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
  );

-- Active effects/buffs with sync support
CREATE TABLE
  character_buffs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    buff_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, buff_type)
  );

-- Skills with sync support
CREATE TABLE
  character_skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    ranks INTEGER NOT NULL DEFAULT 0,
    class_skill BOOLEAN DEFAULT FALSE,
    ability TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
  );

-- Spell slots with sync support
CREATE TABLE
  character_spell_slots (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    spell_level INTEGER NOT NULL,
    total INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, spell_level)
  );

-- Known spells with sync support
CREATE TABLE
  character_known_spells (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    spell_level INTEGER NOT NULL,
    spell_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, spell_name)
  );

-- Combat stats with sync support
CREATE TABLE
  character_combat_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    bombs_left INTEGER NOT NULL DEFAULT 0,
    base_attack_bonus INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
  );

-- Consumables with sync support
CREATE TABLE
  character_consumables (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    alchemist_fire INTEGER NOT NULL DEFAULT 0,
    acid INTEGER NOT NULL DEFAULT 0,
    tanglefoot INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
  );

  -- ABP bonuses tracking
CREATE TABLE character_abp_bonuses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    bonus_type TEXT NOT NULL,
    value INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, bonus_type)
);

-- Equipment tracking
CREATE TABLE character_equipment (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    equipped BOOLEAN DEFAULT false,
    properties JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, name)
);

-- Class features tracking
CREATE TABLE character_class_features (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_level INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    properties JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, feature_name)
);

-- Discoveries tracking
CREATE TABLE character_discoveries (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    discovery_name TEXT NOT NULL,
    selected_level INTEGER NOT NULL,
    properties JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, discovery_name)
);

-- Feats tracking
CREATE TABLE character_feats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    feat_name TEXT NOT NULL,
    feat_type TEXT NOT NULL,
    selected_level INTEGER NOT NULL,
    properties JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, feat_name)
);

-- Update triggers for timestamps
CREATE
OR REPLACE FUNCTION update_timestamp () RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_characters_timestamp BEFORE
UPDATE ON characters FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_buffs_timestamp BEFORE
UPDATE ON character_buffs FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_skills_timestamp BEFORE
UPDATE ON character_skills FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_spell_slots_timestamp BEFORE
UPDATE ON character_spell_slots FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_known_spells_timestamp BEFORE
UPDATE ON character_known_spells FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_combat_stats_timestamp BEFORE
UPDATE ON character_combat_stats FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_consumables_timestamp BEFORE
UPDATE ON character_consumables FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();

CREATE TRIGGER update_character_attributes_timestamp BEFORE
UPDATE ON character_attributes FOR EACH ROW
EXECUTE FUNCTION update_timestamp ();



-- Add these triggers after the existing ones:
CREATE TRIGGER update_character_abp_bonuses_timestamp BEFORE
UPDATE ON character_abp_bonuses FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_equipment_timestamp BEFORE
UPDATE ON character_equipment FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_class_features_timestamp BEFORE
UPDATE ON character_class_features FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_discoveries_timestamp BEFORE
UPDATE ON character_discoveries FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_feats_timestamp BEFORE
UPDATE ON character_feats FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Initial data insertion modified to include user_id
DO $$ 
DECLARE
    user_uuid UUID;
    character_id BIGINT;
BEGIN
    -- Set a default user_id for testing
    user_uuid := '9c4e4bb1-db8d-41df-b796-b9454622eed2'::UUID;

    -- Insert base character and immediately get the ID
    INSERT INTO characters (
        user_id, name, class, race, level, current_hp, max_hp
    ) VALUES (
        user_uuid, 'Vardon Salvador', 'Alchemist', 'Tengu', 5, 35, 35
    ) RETURNING id INTO character_id;

    -- Insert all related data using the character_id directly
    INSERT INTO character_attributes (character_id, str, dex, con, int, wis, cha, is_temporary) 
    VALUES (character_id, 12, 16, 12, 20, 10, 8, false);

    INSERT INTO character_combat_stats (character_id, bombs_left, base_attack_bonus) VALUES
        (character_id, 8, 3);

    INSERT INTO character_consumables (character_id, alchemist_fire, acid, tanglefoot) VALUES
        (character_id, 3, 3, 3);

    INSERT INTO character_spell_slots (character_id, spell_level, total, remaining) VALUES
        (character_id, 1, 4, 4),
        (character_id, 2, 2, 2);

    INSERT INTO character_known_spells (character_id, spell_level, spell_name) VALUES
        (character_id, 1, 'Shield'),
        (character_id, 1, 'Cure Light Wounds'),
        (character_id, 1, 'Enlarge Person'),
        (character_id, 2, 'Invisibility'),
        (character_id, 2, 'Bull''s Strength');

    INSERT INTO character_buffs (character_id, buff_type, is_active) VALUES
        (character_id, 'cognatogen', false),
        (character_id, 'dex_mutagen', false),
        (character_id, 'deadly_aim', false),
        (character_id, 'rapid_shot', false),
        (character_id, 'two_weapon_fighting', false);

    INSERT INTO character_skills (character_id, skill_name, ranks, class_skill, ability) VALUES
        (character_id, 'acrobatics', 5, true, 'dex'),
        (character_id, 'appraise', 5, true, 'int'),
        (character_id, 'craftAlchemy', 5, true, 'int'),
        (character_id, 'disableDevice', 5, true, 'dex'),
        (character_id, 'knowledgeArcana', 5, true, 'int'),
        (character_id, 'knowledgeNature', 5, true, 'int'),
        (character_id, 'perception', 5, true, 'wis'),
        (character_id, 'sleightOfHand', 5, true, 'dex'),
        (character_id, 'spellcraft', 5, true, 'int'),
        (character_id, 'useMagicDevice', 5, true, 'cha'),
        (character_id, 'stealth', 3, false, 'dex'),
        (character_id, 'survival', 1, false, 'wis'),
        (character_id, 'swim', 1, false, 'str');


-- Add these to the initial data insertion:
INSERT INTO character_discoveries (character_id, discovery_name, selected_level) VALUES
    (character_id, 'Infusion', 2),
    (character_id, 'Precise Bombs', 2),
    (character_id, 'Mutagen', 2),
    (character_id, 'Explosive Bomb', 4);

INSERT INTO character_feats (character_id, feat_name, feat_type, selected_level) VALUES
    (character_id, 'Tengu Wings', 'racial', 1),
    (character_id, 'Two Weapon Fighting', 'combat', 1),
    (character_id, 'Rapid Shot', 'combat', 3),
    (character_id, 'Deadly Aim', 'combat', 3),
    (character_id, 'Extra Discovery', 'general', 5),
    (character_id, 'Breadth of Knowledge', 'general', 5);

INSERT INTO character_equipment (character_id, name, type, equipped, properties) VALUES
    (character_id, 'Mithral Chainshirt', 'armor', true, '{"armor_bonus": 4, "max_dex": 6, "armor_check_penalty": 0}'),
    (character_id, 'Masterwork Dagger', 'weapon', true, '{"damage": "1d4", "crit_range": "19-20", "crit_mult": 2}'),
    (character_id, 'Alchemist''s Kit', 'gear', true, '{"bonus": 2, "type": "circumstance"}');


    RAISE NOTICE 'Created character with ID: %', character_id;
END $$;



-- Enable realtime for all relevant tables
alter publication supabase_realtime add table characters;
alter publication supabase_realtime add table character_attributes;
alter publication supabase_realtime add table character_combat_stats;
alter publication supabase_realtime add table character_consumables;

-- Simple policies that allow all access
create policy "Public realtime access"
    on characters for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_attributes for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_combat_stats for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_consumables for all
    using (true)
    with check (true);


-- Make sure realtime is enabled for the tables
alter table characters replica identity full;
alter table character_attributes replica identity full;
alter table character_combat_stats replica identity full;
alter table character_consumables replica identity full;

-- Enable realtime for character_buffs table
alter publication supabase_realtime add table character_buffs;

-- Add policy for character_buffs
create policy "Public realtime access"
    on character_buffs for all
    using (true)
    with check (true);

-- Enable full replica identity for character_buffs
alter table character_buffs replica identity full;




-- Add these table definitions after the existing ones:



-- Add these to enable realtime for new tables:
alter publication supabase_realtime add table character_abp_bonuses;
alter publication supabase_realtime add table character_equipment;
alter publication supabase_realtime add table character_class_features;
alter publication supabase_realtime add table character_discoveries;
alter publication supabase_realtime add table character_feats;

-- Add policies for new tables:
create policy "Public realtime access"
    on character_abp_bonuses for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_equipment for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_class_features for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_discoveries for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_feats for all
    using (true)
    with check (true);

-- Enable full replica identity for new tables:
alter table character_abp_bonuses replica identity full;
alter table character_equipment replica identity full;
alter table character_class_features replica identity full;
alter table character_discoveries replica identity full;
alter table character_feats replica identity full;