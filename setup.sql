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

-- Initial data insertion modified to include user_id
DO $$ 
DECLARE
    user_uuid UUID;
BEGIN
    -- Set a default user_id for testing (replace with actual auth user id in production)
    user_uuid := '9c4e4bb1-db8d-41df-b796-b9454622eed2'::UUID;

    -- Insert base character with user_id
    INSERT INTO characters (
        user_id,
        name,
        class,
        race,
        level,
        current_hp
    ) VALUES (
        user_uuid,
        'Vardon Salvador',
        'Alchemist',
        'Tengu',
        5,
        45
    );

    -- Get the last inserted character ID
    DECLARE
        character_id BIGINT;
    BEGIN
        SELECT currval(pg_get_serial_sequence('characters', 'id')) INTO character_id;

        -- Insert base attributes, skills, combat stats, consumables, spell slots, known spells, and buffs
        INSERT INTO character_attributes (character_id, str, dex, con, int, wis, cha, is_temporary) VALUES
            (character_id, 12, 16, 12, 20, 10, 8, false);

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

        -- Return the character ID for reference
        RAISE NOTICE 'Created character with ID: %', character_id;
    END;
END $$;