-- SETUP.SQL PART 1: DROPS AND EXTENSIONS --

DROP VIEW IF EXISTS character_skill_view;

-- Drop triggers first (in reverse order to avoid dependencies)
DROP TRIGGER IF EXISTS update_character_consumables_timestamp ON character_consumables;
DROP TRIGGER IF EXISTS update_character_combat_stats_timestamp ON character_combat_stats;
DROP TRIGGER IF EXISTS update_character_known_spells_timestamp ON character_known_spells;
DROP TRIGGER IF EXISTS update_character_spell_slots_timestamp ON character_spell_slots;
DROP TRIGGER IF EXISTS update_character_buffs_timestamp ON character_buffs;
DROP TRIGGER IF EXISTS update_characters_timestamp ON characters;
DROP TRIGGER IF EXISTS update_character_attributes_timestamp ON character_attributes;
DROP TRIGGER IF EXISTS update_character_extracts_timestamp ON character_extracts;
DROP TRIGGER IF EXISTS update_character_abp_bonuses_timestamp ON character_abp_bonuses;
DROP TRIGGER IF EXISTS update_character_equipment_timestamp ON character_equipment;
DROP TRIGGER IF EXISTS update_character_class_features_timestamp ON character_class_features;
DROP TRIGGER IF EXISTS update_character_discoveries_timestamp ON character_discoveries;
DROP TRIGGER IF EXISTS update_character_feats_timestamp ON character_feats;
DROP TRIGGER IF EXISTS update_character_corruptions_timestamp ON character_corruptions;
DROP TRIGGER IF EXISTS update_character_corruption_manifestations_timestamp ON character_corruption_manifestations;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS character_corruption_manifestations CASCADE;
DROP TABLE IF EXISTS character_corruptions CASCADE;
DROP TABLE IF EXISTS character_consumables CASCADE;
DROP TABLE IF EXISTS character_combat_stats CASCADE;
DROP TABLE IF EXISTS character_known_spells CASCADE;
DROP TABLE IF EXISTS character_spell_slots CASCADE;
DROP TABLE IF EXISTS character_buffs CASCADE;
DROP TABLE IF EXISTS character_attributes CASCADE;
DROP TABLE IF EXISTS character_abp_bonuses CASCADE;
DROP TABLE IF EXISTS character_equipment CASCADE;
DROP TABLE IF EXISTS character_class_features CASCADE;
DROP TABLE IF EXISTS character_discoveries CASCADE;
DROP TABLE IF EXISTS character_feats CASCADE;
DROP TABLE IF EXISTS character_extracts CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS character_skill_ranks CASCADE;
DROP TABLE IF EXISTS class_skill_relations CASCADE;
DROP TABLE IF EXISTS base_skills CASCADE;

-- Drop extension if it was created for UUID support
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SETUP.SQL PART 2: TABLE CREATION --

-- Base character table with Supabase-specific columns
CREATE TABLE characters (
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
CREATE TABLE character_attributes (
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
CREATE TABLE character_buffs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    buff_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, buff_type)
);

-- Skills with sync support
CREATE TABLE base_skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    ability TEXT NOT NULL,
    trained_only BOOLEAN DEFAULT FALSE,
    armor_check_penalty BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_skill_relations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    class_name TEXT NOT NULL,
    skill_id BIGINT REFERENCES base_skills(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_name, skill_id)
);

CREATE TABLE character_skill_ranks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    skill_id BIGINT REFERENCES base_skills(id),
    ranks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE(character_id, skill_id)
);

-- Spell slots with sync support
CREATE TABLE character_spell_slots (
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
CREATE TABLE character_known_spells (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    spell_level INTEGER NOT NULL,
    spell_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, spell_name)
);

-- Combat stats with sync support
CREATE TABLE character_combat_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    bombs_left INTEGER NOT NULL DEFAULT 0,
    base_attack_bonus INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

-- Consumables with sync support
CREATE TABLE character_consumables (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    alchemist_fire INTEGER NOT NULL DEFAULT 0,
    acid INTEGER NOT NULL DEFAULT 0,
    tanglefoot INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

-- SETUP.SQL PART 3: MORE TABLE CREATION --

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

-- Extracts tracking
CREATE TABLE character_extracts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    extract_name TEXT NOT NULL,
    extract_level INTEGER NOT NULL,
    prepared INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, extract_name)
);

-- Corruption tracking
CREATE TABLE character_corruptions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    corruption_type TEXT NOT NULL,
    corruption_stage INTEGER DEFAULT 0,
    manifestation_level INTEGER DEFAULT 1,
    last_feed_date TIMESTAMP WITH TIME ZONE,
    blood_required INTEGER,
    blood_consumed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

-- Corruption manifestations
CREATE TABLE character_corruption_manifestations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    corruption_id BIGINT REFERENCES character_corruptions(id) ON DELETE CASCADE,
    manifestation_name TEXT NOT NULL,
    gift_active BOOLEAN DEFAULT true,
    stain_active BOOLEAN DEFAULT true,
    prerequisite_manifestation TEXT,
    min_manifestation_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

-- SETUP.SQL PART 4: TRIGGERS AND FUNCTIONS --

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Character table trigger
CREATE TRIGGER update_characters_timestamp 
    BEFORE UPDATE ON characters 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Buffs table trigger
CREATE TRIGGER update_character_buffs_timestamp 
    BEFORE UPDATE ON character_buffs 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Spell slots table trigger
CREATE TRIGGER update_character_spell_slots_timestamp 
    BEFORE UPDATE ON character_spell_slots 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Known spells table trigger
CREATE TRIGGER update_character_known_spells_timestamp 
    BEFORE UPDATE ON character_known_spells 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Combat stats table trigger
CREATE TRIGGER update_character_combat_stats_timestamp 
    BEFORE UPDATE ON character_combat_stats 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Consumables table trigger
CREATE TRIGGER update_character_consumables_timestamp 
    BEFORE UPDATE ON character_consumables 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Attributes table trigger
CREATE TRIGGER update_character_attributes_timestamp 
    BEFORE UPDATE ON character_attributes 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Extracts table trigger
CREATE TRIGGER update_character_extracts_timestamp 
    BEFORE UPDATE ON character_extracts 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ABP bonuses table trigger
CREATE TRIGGER update_character_abp_bonuses_timestamp 
    BEFORE UPDATE ON character_abp_bonuses 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Equipment table trigger
CREATE TRIGGER update_character_equipment_timestamp 
    BEFORE UPDATE ON character_equipment 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Class features table trigger
CREATE TRIGGER update_character_class_features_timestamp 
    BEFORE UPDATE ON character_class_features 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Discoveries table trigger
CREATE TRIGGER update_character_discoveries_timestamp 
    BEFORE UPDATE ON character_discoveries 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Feats table trigger
CREATE TRIGGER update_character_feats_timestamp 
    BEFORE UPDATE ON character_feats 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Corruptions table trigger
CREATE TRIGGER update_character_corruptions_timestamp 
    BEFORE UPDATE ON character_corruptions 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Corruption manifestations table trigger
CREATE TRIGGER update_character_corruption_manifestations_timestamp 
    BEFORE UPDATE ON character_corruption_manifestations 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_base_skills_timestamp 
    BEFORE UPDATE ON base_skills 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_class_skill_relations_timestamp 
    BEFORE UPDATE ON class_skill_relations 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_skill_ranks_timestamp 
    BEFORE UPDATE ON character_skill_ranks 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

  -- SETUP.SQL PART 5: INITIAL DATA INSERTION --

DO $$ 
DECLARE
    user_uuid UUID;
    character_id BIGINT;
    corruption_id BIGINT;
BEGIN
    -- Set a default user_id for testing
    user_uuid := '9c4e4bb1-db8d-41df-b796-b9454622eed2'::UUID;

    -- Insert base character and immediately get the ID
    INSERT INTO characters (
        user_id, name, class, race, level, current_hp, max_hp
    ) VALUES (
        user_uuid, 'Vardon Salvador', 'Alchemist', 'Tengu', 5, 35, 35
    ) RETURNING id INTO character_id;

    -- Insert attributes
    INSERT INTO character_attributes (character_id, str, dex, con, int, wis, cha, is_temporary) 
    VALUES (character_id, 12, 16, 12, 20, 10, 8, false);

    -- Insert combat stats
    INSERT INTO character_combat_stats (character_id, bombs_left, base_attack_bonus) 
    VALUES (character_id, 8, 3);

    -- Insert consumables
    INSERT INTO character_consumables (character_id, alchemist_fire, acid, tanglefoot) 
    VALUES (character_id, 3, 3, 3);

    -- Insert spell slots
    INSERT INTO character_spell_slots (character_id, spell_level, total, remaining) VALUES
        (character_id, 1, 4, 4),
        (character_id, 2, 2, 2);

    -- Insert known spells
    INSERT INTO character_known_spells (character_id, spell_level, spell_name) VALUES
        (character_id, 1, 'Shield'),
        (character_id, 1, 'Cure Light Wounds'),
        (character_id, 1, 'Enlarge Person'),
        (character_id, 2, 'Invisibility'),
        (character_id, 2, 'Bull''s Strength');

    -- Insert buffs
    INSERT INTO character_buffs (character_id, buff_type, is_active) VALUES
        (character_id, 'cognatogen', false),
        (character_id, 'dex_mutagen', false),
        (character_id, 'deadly_aim', false),
        (character_id, 'rapid_shot', false),
        (character_id, 'two_weapon_fighting', false);

-- Insert base skills
INSERT INTO base_skills (name, ability, trained_only, armor_check_penalty) VALUES
('Acrobatics', 'dex', false, true),
('Appraise', 'int', false, false),
('Bluff', 'cha', false, false),
('Climb', 'str', false, true),
('Craft (Alchemy)', 'int', false, false),
('Craft (Armor)', 'int', false, false),
('Craft (Weapons)', 'int', false, false),
('Diplomacy', 'cha', false, false),
('Disable Device', 'dex', true, true),
('Disguise', 'cha', false, false),
('Escape Artist', 'dex', false, true),
('Fly', 'dex', false, true),
('Handle Animal', 'cha', true, false),
('Heal', 'wis', false, false),
('Intimidate', 'cha', false, false),
('Knowledge (Arcana)', 'int', true, false),
('Knowledge (Dungeoneering)', 'int', true, false),
('Knowledge (Engineering)', 'int', true, false),
('Knowledge (Geography)', 'int', true, false),
('Knowledge (History)', 'int', true, false),
('Knowledge (Local)', 'int', true, false),
('Knowledge (Nature)', 'int', true, false),
('Knowledge (Nobility)', 'int', true, false),
('Knowledge (Planes)', 'int', true, false),
('Knowledge (Religion)', 'int', true, false),
('Linguistics', 'int', true, false),
('Perception', 'wis', false, false),
('Profession', 'wis', true, false),
('Ride', 'dex', false, true),
('Sense Motive', 'wis', false, false),
('Sleight of Hand', 'dex', true, true),
('Spellcraft', 'int', true, false),
('Stealth', 'dex', false, true),
('Survival', 'wis', false, false),
('Swim', 'str', false, true),
('Use Magic Device', 'cha', true, false);

-- Insert Alchemist class skills
INSERT INTO class_skill_relations (class_name, skill_id)
SELECT 'Alchemist', id FROM base_skills
WHERE name IN (
    'Appraise',
    'Craft (Alchemy)',
    'Disable Device',
    'Fly',
    'Heal',
    'Knowledge (Arcana)',
    'Knowledge (Nature)',
    'Perception',
    'Profession',
    'Sleight of Hand',
    'Spellcraft',
    'Survival',
    'Use Magic Device'
);

-- Insert initial ranks for the character
INSERT INTO character_skill_ranks (character_id, skill_id, ranks)
SELECT character_id, bs.id, 
    CASE bs.name
        WHEN 'Craft (Alchemy)' THEN 5
        WHEN 'Disable Device' THEN 5
        WHEN 'Knowledge (Arcana)' THEN 5
        WHEN 'Knowledge (Nature)' THEN 5
        WHEN 'Perception' THEN 5
        WHEN 'Sleight of Hand' THEN 5
        WHEN 'Spellcraft' THEN 5
        WHEN 'Use Magic Device' THEN 5
        WHEN 'Stealth' THEN 3
        WHEN 'Survival' THEN 1
        ELSE 0
    END
FROM base_skills bs;

    -- Insert discoveries
    INSERT INTO character_discoveries (character_id, discovery_name, selected_level) VALUES
        (character_id, 'Infusion', 2),
        (character_id, 'Precise Bombs', 2),
        (character_id, 'Mutagen', 2),
        (character_id, 'Explosive Bomb', 4);

    -- Insert feats
    INSERT INTO character_feats (character_id, feat_name, feat_type, selected_level) VALUES
        (character_id, 'Tengu Wings', 'racial', 1),
        (character_id, 'Two Weapon Fighting', 'combat', 1),
        (character_id, 'Rapid Shot', 'combat', 3),
        (character_id, 'Deadly Aim', 'combat', 3),
        (character_id, 'Extra Discovery', 'general', 5),
        (character_id, 'Breadth of Knowledge', 'general', 5);

    -- Insert equipment
    INSERT INTO character_equipment (character_id, name, type, equipped, properties) VALUES
        (character_id, 'Mithral Chainshirt', 'armor', true, '{"armor_bonus": 4, "max_dex": 6, "armor_check_penalty": 0}'),
        (character_id, 'Masterwork Dagger', 'weapon', true, '{"damage": "1d4", "crit_range": "19-20", "crit_mult": 2}'),
        (character_id, 'Alchemist''s Kit', 'gear', true, '{"bonus": 2, "type": "circumstance"}');

    -- Insert class features
    INSERT INTO character_class_features (character_id, feature_name, feature_level, properties) VALUES
        (character_id, 'AlchemicalBombs', 1, '{"damage": "1d6", "splash_damage": "1", "range": "20 ft"}'::jsonb),
        (character_id, 'Brew Potion', 1, '{"description": "Can brew potions of spells known"}'::jsonb),
        (character_id, 'ThrowAnything', 1, '{"description": "Add Int modifier to thrown weapon damage"}'::jsonb),
        (character_id, 'Extracts', 1, '{"slots_per_day": {"1": 4, "2": 2}}'::jsonb),
        (character_id, 'SwiftAlchemy', 3, '{"description": "Create alchemical items at twice the normal speed"}'::jsonb),
        (character_id, 'SwiftPoisoning', 4, '{"description": "Apply poison as a move action"}'::jsonb),
        (character_id, 'PoisonResistance', 2, '{"bonus": 2, "type": "natural"}'::jsonb),
        (character_id, 'PoisonUse', 2, '{"description": "Never risk poisoning self when applying poison"}'::jsonb);

    -- Insert ABP bonuses
    INSERT INTO character_abp_bonuses (character_id, bonus_type, value) VALUES
        (character_id, 'resistance', 1),
        (character_id, 'armor_attunement', 1),
        (character_id, 'weapon_attunement', 1),
        (character_id, 'deflection', 1),
        (character_id, 'mental_prowess', 2),
        (character_id, 'physical_prowess', 2);

    -- Insert extracts
    INSERT INTO character_extracts (character_id, extract_name, extract_level, prepared, used) VALUES
        (character_id, 'Shield', 1, 2, 0),
        (character_id, 'Cure Light Wounds', 1, 1, 0),
        (character_id, 'Enlarge Person', 1, 1, 0),
        (character_id, 'Invisibility', 2, 1, 0),
        (character_id, 'Bull''s Strength', 2, 1, 0);

    -- Insert vampire corruption
    INSERT INTO character_corruptions 
        (character_id, corruption_type, manifestation_level, blood_required) 
    VALUES 
        (character_id, 'vampirism', 5, 5)
    RETURNING id INTO corruption_id;

    -- Insert vampire manifestations
    INSERT INTO character_corruption_manifestations 
        (character_id, corruption_id, manifestation_name, min_manifestation_level, prerequisite_manifestation) 
    VALUES
        (character_id, corruption_id, 'Vampiric Grace', 1, NULL),
        (character_id, corruption_id, 'Fangs', 2, NULL),
        (character_id, corruption_id, 'Unlife', 3, NULL),
        (character_id, corruption_id, 'Greater Unlife', 4, 'Unlife'),
        (character_id, corruption_id, 'True Unlife', 5, 'Greater Unlife');

    RAISE NOTICE 'Created character with ID: %', character_id;
END $$;


-- SETUP.SQL PART 6: REALTIME ENABLEMENT AND POLICIES --

-- Enable realtime for all tables
alter publication supabase_realtime add table characters;
alter publication supabase_realtime add table character_attributes;
alter publication supabase_realtime add table character_combat_stats;
alter publication supabase_realtime add table character_consumables;
alter publication supabase_realtime add table character_abp_bonuses;
alter publication supabase_realtime add table character_equipment;
alter publication supabase_realtime add table character_class_features;
alter publication supabase_realtime add table character_discoveries;
alter publication supabase_realtime add table character_feats;
alter publication supabase_realtime add table character_buffs;
alter publication supabase_realtime add table character_spell_slots;
alter publication supabase_realtime add table character_known_spells;
alter publication supabase_realtime add table character_extracts;
alter publication supabase_realtime add table character_corruptions;
alter publication supabase_realtime add table character_corruption_manifestations;
alter publication supabase_realtime add table base_skills;
alter publication supabase_realtime add table class_skill_relations;
alter publication supabase_realtime add table character_skill_ranks;

-- Create policies for all tables
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

create policy "Public realtime access"
    on character_buffs for all
    using (true)
    with check (true);

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

create policy "Public realtime access"
    on character_spell_slots for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_known_spells for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_extracts for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_corruptions for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_corruption_manifestations for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on base_skills for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on class_skill_relations for all
    using (true)
    with check (true);

create policy "Public realtime access"
    on character_skill_ranks for all
    using (true)
    with check (true);

-- Enable full replica identity for all tables
alter table characters replica identity full;
alter table character_attributes replica identity full;
alter table character_combat_stats replica identity full;
alter table character_consumables replica identity full;
alter table character_buffs replica identity full;
alter table character_abp_bonuses replica identity full;
alter table character_equipment replica identity full;
alter table character_class_features replica identity full;
alter table character_discoveries replica identity full;
alter table character_feats replica identity full;
alter table character_spell_slots replica identity full;
alter table character_known_spells replica identity full;
alter table character_extracts replica identity full;
alter table character_corruptions replica identity full;
alter table character_corruption_manifestations replica identity full;
alter table base_skills replica identity full;
alter table class_skill_relations replica identity full;
alter table character_skill_ranks replica identity full;

-- Add to setup.sql
CREATE OR REPLACE VIEW character_skill_view AS
SELECT 
    csr.character_id,
    bs.id as skill_id,
    bs.name as skill_name,
    bs.ability,
    bs.trained_only,
    bs.armor_check_penalty,
    csr.ranks,
    EXISTS (
        SELECT 1 
        FROM class_skill_relations cr
        JOIN characters c ON c.class = cr.class_name
        WHERE cr.skill_id = bs.id
        AND c.id = csr.character_id
    ) as is_class_skill
FROM base_skills bs
CROSS JOIN characters c
LEFT JOIN character_skill_ranks csr ON csr.skill_id = bs.id AND csr.character_id = c.id;