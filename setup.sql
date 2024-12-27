-- ==================================
-- PART 1: DROPS AND EXTENSIONS
-- ==================================

-------------------
-- DROP VIEWS
-------------------
DROP VIEW IF EXISTS character_skill_view;

-------------------
-- DROP TRIGGERS (REVERSE DEPENDENCY ORDER)
-------------------
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
DROP TRIGGER IF EXISTS update_character_favored_class_bonuses_timestamp ON character_favored_class_bonuses;
DROP TRIGGER IF EXISTS update_character_traits_timestamp ON character_traits;
DROP TRIGGER IF EXISTS update_base_traits_timestamp ON base_traits;
DROP TRIGGER IF EXISTS update_base_ancestries_timestamp ON base_ancestries;
DROP TRIGGER IF EXISTS update_base_ancestral_traits_timestamp ON base_ancestral_traits;
DROP TRIGGER IF EXISTS update_base_buffs_timestamp ON base_buffs;
DROP TRIGGER IF EXISTS update_base_feats_timestamp ON base_feats;

-------------------
-- DROP TABLES (REVERSE DEPENDENCY ORDER)
-------------------
DROP TABLE IF EXISTS character_favored_class_bonuses CASCADE;
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
DROP TABLE IF EXISTS base_traits CASCADE;
DROP TABLE IF EXISTS base_ancestries CASCADE;
DROP TABLE IF EXISTS base_ancestral_traits CASCADE;
DROP TABLE IF EXISTS base_buffs CASCADE;
DROP TABLE IF EXISTS base_feats CASCADE;
DROP TABLE IF EXISTS character_traits CASCADE;
DROP TABLE IF EXISTS character_ancestries CASCADE;
DROP TABLE IF EXISTS character_ancestral_traits CASCADE;

-- Drop extension if it was created for UUID support
DROP EXTENSION IF EXISTS "uuid-ossp";

-------------------
-- CREATE EXTENSION
-------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==================================
-- PART 2: TABLE CREATION
-- ==================================

--------------------------
-- 2.1) BASE ANCESTRIES
--------------------------
CREATE TABLE base_ancestries (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    size TEXT NOT NULL,
    base_speed INTEGER NOT NULL,
    ability_modifiers JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------
-- 2.2) BASE ANCESTRAL TRAITS
--------------------------
CREATE TABLE base_ancestral_traits (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    ancestry_id BIGINT REFERENCES base_ancestries(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits JSONB,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ancestry_id, name)
);

--------------------------
-- 2.3) CHARACTERS
--------------------------
CREATE TABLE characters (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users (id),
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    ancestry TEXT NOT NULL,
    level INTEGER NOT NULL,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    archetype TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_offline BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE characters
ADD CONSTRAINT characters_name_user_id_key UNIQUE (name, user_id);

--------------------------
-- 2.4) CHARACTER ANCESTRAL TRAITS
--------------------------
CREATE TABLE character_ancestral_traits (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    ancestral_trait_id BIGINT REFERENCES base_ancestral_traits(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE(character_id, ancestral_trait_id)
);

--------------------------
-- 2.5) CHARACTER ANCESTRIES
--------------------------
CREATE TABLE character_ancestries (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    ancestry_id BIGINT REFERENCES base_ancestries(id),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE(character_id, ancestry_id)
);

--------------------------
-- 2.6) CHARACTER ATTRIBUTES
--------------------------
CREATE TABLE character_attributes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    str INTEGER NOT NULL,
    dex INTEGER NOT NULL,
    con INTEGER NOT NULL,
    int INTEGER NOT NULL,
    wis INTEGER NOT NULL,
    cha INTEGER NOT NULL,
    is_temporary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

--------------------------
-- 2.7) BASE BUFFS
--------------------------
CREATE TABLE base_buffs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    effects JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------
-- 2.8) BASE FEATS
--------------------------
CREATE TABLE base_feats (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    effects JSONB NOT NULL DEFAULT '[]'::jsonb,
    feat_type TEXT NOT NULL,
    prerequisites JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------
-- 2.9) CHARACTER BUFFS
--------------------------
CREATE TABLE character_buffs (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    base_buff_id BIGINT REFERENCES base_buffs(id),
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, base_buff_id)
);

--------------------------
-- 2.10) CHARACTER FEATS
--------------------------
CREATE TABLE character_feats (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    base_feat_id BIGINT REFERENCES base_feats(id),
    selected_level INTEGER NOT NULL,
    properties JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, base_feat_id)
);

--------------------------
-- 2.11) BASE SKILLS
--------------------------
CREATE TABLE base_skills (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    ability TEXT NOT NULL,
    trained_only BOOLEAN DEFAULT FALSE,
    armor_check_penalty BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------
-- 2.12) CLASS SKILL RELATIONS
--------------------------
CREATE TABLE class_skill_relations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    class_name TEXT NOT NULL,
    skill_id BIGINT REFERENCES base_skills(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_name, skill_id)
);

--------------------------
-- 2.13) CHARACTER SKILL RANKS
--------------------------
-- Create the ENUM type first
DROP TYPE IF EXISTS skill_rank_source CASCADE;
CREATE TYPE skill_rank_source AS ENUM ('class', 'favored_class', 'intelligence', 'other');

CREATE TABLE character_skill_ranks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    skill_id BIGINT REFERENCES base_skills(id),
    source skill_rank_source NOT NULL,
    applied_at_level INTEGER NOT NULL,
    ranks INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

--------------------------
-- 2.14) CHARACTER SPELL SLOTS
--------------------------
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

--------------------------
-- 2.15) CHARACTER KNOWN SPELLS
--------------------------
CREATE TABLE character_known_spells (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    spell_level INTEGER NOT NULL,
    spell_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, spell_name)
);

--------------------------
-- 2.16) CHARACTER COMBAT STATS
--------------------------
CREATE TABLE character_combat_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    bombs_left INTEGER NOT NULL DEFAULT 0,
    base_attack_bonus INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

--------------------------
-- 2.17) CHARACTER CONSUMABLES
--------------------------
CREATE TABLE character_consumables (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    alchemist_fire INTEGER NOT NULL DEFAULT 0,
    acid INTEGER NOT NULL DEFAULT 0,
    tanglefoot INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

--------------------------
-- 2.18) CHARACTER ABP BONUSES
--------------------------
CREATE TABLE character_abp_bonuses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters (id) ON DELETE CASCADE,
    bonus_type TEXT NOT NULL,
    value INTEGER NOT NULL,
    value_target TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE (character_id, bonus_type)
);

--------------------------
-- 2.19) CHARACTER EQUIPMENT
--------------------------
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

--------------------------
-- 2.20) CHARACTER CLASS FEATURES
--------------------------
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

--------------------------
-- 2.21) CHARACTER DISCOVERIES
--------------------------
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

--------------------------
-- 2.22) CHARACTER EXTRACTS
--------------------------
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

--------------------------
-- 2.23) CHARACTER CORRUPTIONS
--------------------------
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

--------------------------
-- 2.24) CHARACTER CORRUPTION MANIFESTATIONS
--------------------------
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

--------------------------
-- 2.25) CHARACTER FAVORED CLASS BONUSES
--------------------------
CREATE TABLE character_favored_class_bonuses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    choice TEXT NOT NULL CHECK (choice IN ('hp', 'skill', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE(character_id, level)
);

--------------------------
-- 2.26) BASE TRAITS
--------------------------
CREATE TABLE base_traits (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    trait_type TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------
-- 2.27) CHARACTER TRAITS
--------------------------
CREATE TABLE character_traits (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
    trait_id BIGINT REFERENCES base_traits(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    UNIQUE(character_id, trait_id)
);


-- ==================================
-- PART 3: TRIGGERS AND FUNCTIONS
-- ==================================

--------------------------
-- 3.1) TIMESTAMP UPDATE FUNCTION
--------------------------
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

--------------------------
-- 3.2) CREATE TRIGGERS
--------------------------
-- Characters
CREATE TRIGGER update_characters_timestamp 
    BEFORE UPDATE ON characters 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Buffs
CREATE TRIGGER update_character_buffs_timestamp 
    BEFORE UPDATE ON character_buffs 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Spell Slots
CREATE TRIGGER update_character_spell_slots_timestamp 
    BEFORE UPDATE ON character_spell_slots 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Known Spells
CREATE TRIGGER update_character_known_spells_timestamp 
    BEFORE UPDATE ON character_known_spells 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Combat Stats
CREATE TRIGGER update_character_combat_stats_timestamp 
    BEFORE UPDATE ON character_combat_stats 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Consumables
CREATE TRIGGER update_character_consumables_timestamp 
    BEFORE UPDATE ON character_consumables 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Attributes
CREATE TRIGGER update_character_attributes_timestamp 
    BEFORE UPDATE ON character_attributes 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Extracts
CREATE TRIGGER update_character_extracts_timestamp 
    BEFORE UPDATE ON character_extracts 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ABP Bonuses
CREATE TRIGGER update_character_abp_bonuses_timestamp 
    BEFORE UPDATE ON character_abp_bonuses 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Equipment
CREATE TRIGGER update_character_equipment_timestamp 
    BEFORE UPDATE ON character_equipment 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Class Features
CREATE TRIGGER update_character_class_features_timestamp 
    BEFORE UPDATE ON character_class_features 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Discoveries
CREATE TRIGGER update_character_discoveries_timestamp 
    BEFORE UPDATE ON character_discoveries 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Feats
CREATE TRIGGER update_character_feats_timestamp 
    BEFORE UPDATE ON character_feats 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Corruptions
CREATE TRIGGER update_character_corruptions_timestamp 
    BEFORE UPDATE ON character_corruptions 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Corruption Manifestations
CREATE TRIGGER update_character_corruption_manifestations_timestamp 
    BEFORE UPDATE ON character_corruption_manifestations 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Skills
CREATE TRIGGER update_base_skills_timestamp 
    BEFORE UPDATE ON base_skills 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_class_skill_relations_timestamp 
    BEFORE UPDATE ON class_skill_relations 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_skill_ranks_timestamp 
    BEFORE UPDATE ON character_skill_ranks 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_favored_class_bonuses_timestamp 
    BEFORE UPDATE ON character_favored_class_bonuses 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Traits
CREATE TRIGGER update_base_traits_timestamp 
    BEFORE UPDATE ON base_traits 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_base_ancestries_timestamp 
    BEFORE UPDATE ON base_ancestries 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_base_ancestral_traits_timestamp 
    BEFORE UPDATE ON base_ancestral_traits 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_traits_timestamp 
    BEFORE UPDATE ON character_traits 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_character_ancestries_timestamp 
    BEFORE UPDATE ON character_ancestries 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Additional new base tables
CREATE TRIGGER update_base_buffs_timestamp 
    BEFORE UPDATE ON base_buffs 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_base_feats_timestamp 
    BEFORE UPDATE ON base_feats 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ==================================
-- PART 4: DISTRIBUTE SKILL RANKS FUNCTION
-- ==================================

-- 4.1) DROP THEN RECREATE TYPE & FUNCTION (just to be safe if repeated)
DROP FUNCTION IF EXISTS distribute_skill_ranks(BIGINT, skill_progression[]);
DROP TYPE IF EXISTS skill_progression CASCADE;

CREATE TYPE skill_progression AS (
    skill_name TEXT,
    ranks_per_level INTEGER[]
);

CREATE OR REPLACE FUNCTION distribute_skill_ranks(
    p_character_id BIGINT,
    p_progressions skill_progression[]
) RETURNS void AS $func$
DECLARE
    v_skill_id BIGINT;
    v_progression skill_progression;
    v_level INTEGER;
BEGIN
    FOREACH v_progression IN ARRAY p_progressions LOOP
        -- Get skill ID with error handling
        SELECT id INTO STRICT v_skill_id 
        FROM base_skills 
        WHERE name = v_progression.skill_name;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Skill not found: %', v_progression.skill_name;
        END IF;

        -- Insert ranks for each level where ranks > 0
        FOR v_level IN 1..array_length(v_progression.ranks_per_level, 1) LOOP
            IF v_progression.ranks_per_level[v_level] > 0 THEN
                INSERT INTO character_skill_ranks (
                    character_id,
                    skill_id,
                    source,
                    applied_at_level,
                    ranks
                ) VALUES (
                    p_character_id,
                    v_skill_id,
                    'class',
                    v_level,
                    v_progression.ranks_per_level[v_level]
                );
            END IF;
        END LOOP;
    END LOOP;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Character or skill not found';
    WHEN OTHERS THEN
        RAISE;
END;
$func$ LANGUAGE plpgsql;


-- ==================================
-- PART 5A: INITIAL DATA (Vardon Salvador)
-- ==================================
DO $$
DECLARE
    v_user_uuid UUID;
    v_character_id BIGINT;
    v_corruption_id BIGINT;
    v_tengu_id BIGINT;
    v_pragmatic_activator_id BIGINT;
    v_clever_wordplay_id BIGINT;

    -- Buff IDs
    v_int_cognatogen_id BIGINT;
    v_wis_cognatogen_id BIGINT;
    v_cha_cognatogen_id BIGINT;
    v_dex_mutagen_id BIGINT;
    v_str_mutagen_id BIGINT;
    v_con_mutagen_id BIGINT;
    v_deadly_aim_id BIGINT;
    v_rapid_shot_id BIGINT;
    v_two_weapon_fighting_id BIGINT;

    -- Feat IDs
    v_tengu_wings_id BIGINT;
    v_two_weapon_fighting_feat_id BIGINT;
    v_rapid_shot_feat_id BIGINT;
    v_deadly_aim_feat_id BIGINT;
    v_extra_discovery_id BIGINT;
    v_breadth_of_experience_id BIGINT;

    -- Skill progressions
    v_progressions skill_progression[];
BEGIN
    -- 1) Set a default user_id for testing
    v_user_uuid := '9c4e4bb1-db8d-41df-b796-b9454622eed2'::UUID;

    -- 2) Insert Tengu ancestry
    INSERT INTO base_ancestries (
        name, 
        size, 
        base_speed, 
        ability_modifiers,
        description
    ) VALUES (
        'Tengu',
        'Medium',
        30,
        '{"dex": 2, "wis": 2, "con": -2}'::jsonb,
        'Tengus are avian humanoids who resemble crows or ravens with human arms and hands.'
    )
    ON CONFLICT (name) DO NOTHING  -- So we don't fail if it already exists
    RETURNING id INTO v_tengu_id;

    IF v_tengu_id IS NULL THEN
       SELECT id INTO v_tengu_id FROM base_ancestries WHERE name='Tengu';
    END IF;

    -- 3) Insert Tengu ancestry traits
    INSERT INTO base_ancestral_traits (
        ancestry_id,
        name,
        description,
        benefits,
        is_optional
    ) VALUES 
      -- Standard Traits
      (v_tengu_id, 'Swordtrained', 
       'Tengus are trained from birth in swordplay, and as a result are automatically proficient with sword-like weapons.',
       '{"weapon_proficiency": ["bastard sword", "dagger", "elven curve blade", "falchion", "greatsword", "kukri", "longsword", "punching dagger", "rapier", "scimitar", "short sword", "two-bladed sword"]}'::jsonb,
       false),
      (v_tengu_id, 'Natural Weapon', 
       'A tengu has a bite attack that deals 1d3 points of damage.',
       '{"natural_attack": {"type": "bite", "damage": "1d3"}}'::jsonb,
       false),
      (v_tengu_id, 'Gifted Linguist', 
       'Tengus gain a +4 racial bonus on Linguistics checks, and learn 2 languages each time they gain a rank in Linguistics rather than 1.',
       '{"skill_bonus": {"linguistics": 4}, "special": "double_languages"}'::jsonb,
       false),
      (v_tengu_id, 'Low-Light Vision', 
       'Tengus have low-light vision allowing them to see twice as far as humans in conditions of dim light.',
       '{"vision": "low-light"}'::jsonb,
       false),
      (v_tengu_id, 'Sneaky', 
       'Tengus gain a +2 racial bonus on Perception and Stealth checks.',
       '{"skill_bonus": {"perception": 2, "stealth": 2}}'::jsonb,
       false),

      -- Alternate Traits
      (v_tengu_id, 'Carrion Sense', 
       'Limited scent ability, only for corpses & badly wounded (50% HP or less).',
       '{"special": "limited_scent"}'::jsonb,
       true),
      (v_tengu_id, 'Claw Attack', 
       'Two claw attacks as primary natural attacks (1d3), treated as having Improved Unarmed Strike.',
       '{"natural_attack": {"type": "claws", "damage": "1d3", "count": 2}, "bonus_feat": "Improved Unarmed Strike"}'::jsonb,
       true),
      (v_tengu_id, 'Deft Swords', 
       'Gain a +2 dodge bonus to CMD while wielding a swordlike weapon.',
       '{"conditional_bonus": {"type": "dodge", "value": 2, "to": "cmd", "condition": "wielding_sword"}}'::jsonb,
       true),
      (v_tengu_id, 'Exotic Weapon Training', 
       'Choose a number of eastern weapons = 3 + Int bonus, gain proficiency.',
       '{"special": "eastern_weapon_training"}'::jsonb,
       true),
      (v_tengu_id, 'Glide', 
       'Can make Fly checks to fall safely without damage & potentially glide.',
       '{"special": "glide"}'::jsonb,
       true)
    ON CONFLICT (ancestry_id, name) DO NOTHING;

    -- 4) Insert example traits (Pragmatic Activator, Clever Wordplay) into base_traits
    INSERT INTO base_traits (
        name,
        trait_type,
        description,
        benefits
    ) VALUES 
      ('Pragmatic Activator',
       'Magic',
       'Use INT instead of CHA for Use Magic Device.',
       '{"skill_modifier_replacement": {"use_magic_device": {"from": "cha", "to": "int"}}}'::jsonb
      )
      ON CONFLICT (name) DO NOTHING
      RETURNING id INTO v_pragmatic_activator_id;

    IF v_pragmatic_activator_id IS NULL THEN
       SELECT id INTO v_pragmatic_activator_id FROM base_traits WHERE name='Pragmatic Activator';
    END IF;

    INSERT INTO base_traits (
        name,
        trait_type,
        description,
        benefits
    ) VALUES 
      ('Clever Wordplay',
       'Social',
       'Use INT instead of CHA for one chosen Cha-based skill.',
       '{"skill_modifier_replacement": {"choosable": {"from": "cha", "to": "int", "count": 1}}}'::jsonb
      )
      ON CONFLICT (name) DO NOTHING
      RETURNING id INTO v_clever_wordplay_id;

    IF v_clever_wordplay_id IS NULL THEN
       SELECT id INTO v_clever_wordplay_id FROM base_traits WHERE name='Clever Wordplay';
    END IF;

    -- 5) Insert base character (Vardon Salvador) to characters
    INSERT INTO characters (
        user_id, 
        name, 
        class, 
        ancestry, 
        level, 
        current_hp, 
        max_hp, 
        archetype
    ) VALUES (
        v_user_uuid, 
        'Vardon Salvador', 
        'Alchemist', 
        'Tengu', 
        5, 
        30, 
        30, 
        'mindchemist'
    )
    ON CONFLICT (name, user_id) DO NOTHING
    RETURNING id INTO v_character_id;

    IF v_character_id IS NULL THEN
       SELECT id INTO v_character_id 
       FROM characters 
       WHERE name='Vardon Salvador' 
         AND user_id=v_user_uuid;
    END IF;

    -- 6) Link chosen traits
    IF v_character_id IS NOT NULL THEN
        -- First get the trait IDs
        SELECT id INTO v_pragmatic_activator_id 
        FROM base_traits 
        WHERE name = 'Pragmatic Activator';

        SELECT id INTO v_clever_wordplay_id 
        FROM base_traits 
        WHERE name = 'Clever Wordplay';

        -- Then insert if we found the IDs
        IF v_pragmatic_activator_id IS NOT NULL AND v_clever_wordplay_id IS NOT NULL THEN
            INSERT INTO character_traits (character_id, trait_id)
            VALUES 
                (v_character_id, v_pragmatic_activator_id),
                (v_character_id, v_clever_wordplay_id)
            ON CONFLICT (character_id, trait_id) DO NOTHING;
        END IF;
    END IF;

    -- 7) Link Tengu ancestry
    IF v_character_id IS NOT NULL AND v_tengu_id IS NOT NULL THEN
        INSERT INTO character_ancestries (character_id, ancestry_id, is_primary)
        VALUES (v_character_id, v_tengu_id, true)
        ON CONFLICT (character_id, ancestry_id) DO NOTHING;
    END IF;

    -- 8) Insert attributes
    INSERT INTO character_attributes (character_id, str, dex, con, int, wis, cha, is_temporary)
    VALUES (v_character_id, 10, 14, 12, 16, 12, 8, false)
    ON CONFLICT DO NOTHING;

    -- 9) Insert combat stats
    INSERT INTO character_combat_stats (character_id, bombs_left, base_attack_bonus) 
    VALUES (v_character_id, 8, 3)
    ON CONFLICT DO NOTHING;

    -- 10) Insert consumables
    INSERT INTO character_consumables (character_id, alchemist_fire, acid, tanglefoot) 
    VALUES (v_character_id, 3, 3, 3)
    ON CONFLICT DO NOTHING;

    -- 11) Insert spell slots
    INSERT INTO character_spell_slots (character_id, spell_level, total, remaining) VALUES
        (v_character_id, 1, 4, 4),
        (v_character_id, 2, 2, 2)
    ON CONFLICT DO NOTHING;

    -- 12) Insert known spells
    INSERT INTO character_known_spells (character_id, spell_level, spell_name) VALUES
        (v_character_id, 1, 'Shield'),
        (v_character_id, 1, 'Cure Light Wounds'),
        (v_character_id, 1, 'Enlarge Person'),
        (v_character_id, 2, 'Invisibility'),
        (v_character_id, 2, 'Bull''s Strength')
    ON CONFLICT DO NOTHING;

    -- 13) Insert base buffs
    INSERT INTO base_buffs (name, label, description)
    VALUES
      ('int_cognatogen', 'INT Cognatogen', 'Grants an Intelligence bonus'),
      ('wis_cognatogen', 'WIS Cognatogen', 'Grants a Wisdom bonus'),
      ('cha_cognatogen', 'CHA Cognatogen', 'Grants a Charisma bonus'),
      ('dex_mutagen', 'DEX Mutagen', 'Grants a Dexterity bonus'),
      ('str_mutagen', 'STR Mutagen', 'Grants a Strength bonus'),
      ('con_mutagen', 'CON Mutagen', 'Grants a Constitution bonus'),
      ('deadly_aim', 'Deadly Aim', 'Trade accuracy for damage with ranged attacks'),
      ('rapid_shot', 'Rapid Shot', 'Make an extra ranged attack each round'),
      ('two_weapon_fighting', 'Two-Weapon Fighting Buff', 'Reduce penalties when fighting with two weapons')
    ON CONFLICT (name) DO NOTHING;

    -- Retrieve buff IDs
    SELECT id INTO v_int_cognatogen_id FROM base_buffs WHERE name='int_cognatogen';
    SELECT id INTO v_wis_cognatogen_id FROM base_buffs WHERE name='wis_cognatogen';
    SELECT id INTO v_cha_cognatogen_id FROM base_buffs WHERE name='cha_cognatogen';
    SELECT id INTO v_dex_mutagen_id     FROM base_buffs WHERE name='dex_mutagen';
    SELECT id INTO v_str_mutagen_id     FROM base_buffs WHERE name='str_mutagen';
    SELECT id INTO v_con_mutagen_id     FROM base_buffs WHERE name='con_mutagen';
    SELECT id INTO v_deadly_aim_id      FROM base_buffs WHERE name='deadly_aim';
    SELECT id INTO v_rapid_shot_id      FROM base_buffs WHERE name='rapid_shot';
    SELECT id INTO v_two_weapon_fighting_id FROM base_buffs WHERE name='two_weapon_fighting';

    -- 14) Link buffs to the character
    IF v_character_id IS NOT NULL THEN
      INSERT INTO character_buffs (character_id, base_buff_id, is_active) VALUES
        (v_character_id, v_int_cognatogen_id, false),
        (v_character_id, v_wis_cognatogen_id, false),
        (v_character_id, v_cha_cognatogen_id, false),
        (v_character_id, v_dex_mutagen_id, false),
        (v_character_id, v_str_mutagen_id, false),
        (v_character_id, v_con_mutagen_id, false),
        (v_character_id, v_deadly_aim_id, false),
        (v_character_id, v_rapid_shot_id, false),
        (v_character_id, v_two_weapon_fighting_id, false)
      ON CONFLICT (character_id, base_buff_id) DO NOTHING;
    END IF;

    -- 15) Insert base skills
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
    ('Use Magic Device', 'cha', true, false)
    ON CONFLICT (name) DO NOTHING;

    -- 16) Insert Alchemist class skills
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
    )
    ON CONFLICT DO NOTHING;

    -- 17) Skill progressions
    v_progressions := ARRAY[
        ('Craft (Alchemy)',     '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Disable Device',      '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Knowledge (Arcana)',  '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Knowledge (Nature)',  '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Perception',          '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Sleight of Hand',     '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Spellcraft',          '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Use Magic Device',    '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Stealth',             '{1,1,1,0,0}'::INTEGER[])::skill_progression,
        ('Survival',            '{1,0,0,0,0}'::INTEGER[])::skill_progression
    ];

    IF v_character_id IS NOT NULL THEN
       PERFORM distribute_skill_ranks(v_character_id, v_progressions);
    END IF;

    -- 18) Insert discoveries
    INSERT INTO character_discoveries (character_id, discovery_name, selected_level) VALUES
        (v_character_id, 'Infusion', 2),
        (v_character_id, 'Precise Bombs', 2),
        (v_character_id, 'Mutagen', 2),
        (v_character_id, 'Explosive Bomb', 4)
    ON CONFLICT DO NOTHING;

    -- 19) Insert some feats into base_feats (for Vardon/Tengu)
    INSERT INTO base_feats (name, label, description, feat_type) VALUES
      ('Tengu Wings', 'Tengu Wings', 'Allows a Tengu to glide or eventually fly', 'racial'),
      ('Two Weapon Fighting', 'Two-Weapon Fighting', 'Reduce penalties for fighting with two weapons', 'combat'),
      ('Rapid Shot', 'Rapid Shot', 'Make one extra ranged attack each round', 'combat'),
      ('Deadly Aim', 'Deadly Aim', 'Trade accuracy for increased ranged damage', 'combat'),
      ('Extra Discovery', 'Extra Discovery', 'Gain one additional alchemist discovery', 'general'),
      ('Breadth of Experience', 'Breadth of Experience', 'Access to knowledge with ease', 'general')
    ON CONFLICT (name) DO NOTHING;

    -- Retrieve IDs
    SELECT id INTO v_tengu_wings_id 
      FROM base_feats WHERE name='Tengu Wings';
    SELECT id INTO v_two_weapon_fighting_feat_id
      FROM base_feats WHERE name='Two Weapon Fighting';
    SELECT id INTO v_rapid_shot_feat_id
      FROM base_feats WHERE name='Rapid Shot';
    SELECT id INTO v_deadly_aim_feat_id
      FROM base_feats WHERE name='Deadly Aim';
    SELECT id INTO v_extra_discovery_id
      FROM base_feats WHERE name='Extra Discovery';
    SELECT id INTO v_breadth_of_experience_id
      FROM base_feats WHERE name='Breadth of Experience';

    -- 20) Link feats for Vardon Salvador
    INSERT INTO character_feats (character_id, base_feat_id, selected_level) VALUES
        (v_character_id, v_tengu_wings_id, 1),
        (v_character_id, v_two_weapon_fighting_feat_id, 1),
        (v_character_id, v_rapid_shot_feat_id, 3),
        (v_character_id, v_deadly_aim_feat_id, 3),
        (v_character_id, v_extra_discovery_id, 5),
        (v_character_id, v_breadth_of_experience_id, 5)
    ON CONFLICT (character_id, base_feat_id) DO NOTHING;

    -- 21) Insert equipment
    INSERT INTO character_equipment (character_id, name, type, equipped, properties) VALUES
        (v_character_id, 'Mithral Chainshirt', 'armor', true, '{"armor_bonus": 4, "max_dex": 6, "armor_check_penalty": 0}'),
        (v_character_id, 'Masterwork Dagger', 'weapon', true, '{"damage": "1d4", "crit_range": "19-20", "crit_mult": 2}'),
        (v_character_id, 'Alchemist''s Kit', 'gear', true, '{"bonus": 2, "type": "circumstance"}')
    ON CONFLICT (character_id, name) DO NOTHING;

    -- 22) Insert class features
    INSERT INTO character_class_features (character_id, feature_name, feature_level, properties) VALUES
        (v_character_id, 'AlchemicalBombs', 1, '{"damage": "1d6", "splash_damage": "1", "range": "20 ft"}'),
        (v_character_id, 'Brew Potion', 1, '{"description": "Can brew potions of spells known"}'),
        (v_character_id, 'ThrowAnything', 1, '{"description": "Add Int modifier to thrown weapon damage"}'),
        (v_character_id, 'Extracts', 1, '{"slots_per_day": {"1": 4, "2": 2}}'),
        (v_character_id, 'SwiftAlchemy', 3, '{"description": "Create alchemical items at twice normal speed"}'),
        (v_character_id, 'SwiftPoisoning', 4, '{"description": "Apply poison as a move action"}'),
        (v_character_id, 'PoisonResistance', 2, '{"bonus": 2, "type": "natural"}'),
        (v_character_id, 'Perfect Recall', 2, '{"description": "Double Intelligence bonus on Knowledge checks"}')
    ON CONFLICT (character_id, feature_name) DO NOTHING;

    -- 23) Insert ABP bonuses
    INSERT INTO character_abp_bonuses (character_id, bonus_type, value, value_target) VALUES
        (v_character_id, 'resistance', 1, NULL),
        (v_character_id, 'armor_attunement', 1, NULL),
        (v_character_id, 'weapon_attunement', 1, NULL),
        (v_character_id, 'deflection', 1, NULL),
        (v_character_id, 'mental_prowess', 2, NULL),
        (v_character_id, 'mental_prowess_choice', 1, 'int'),
        (v_character_id, 'physical_prowess', 2, NULL),
        (v_character_id, 'physical_prowess_choice', 1, 'dex')
    ON CONFLICT (character_id, bonus_type) DO NOTHING;

    -- 24) Insert extracts
    INSERT INTO character_extracts (character_id, extract_name, extract_level, prepared, used) VALUES
        (v_character_id, 'Shield', 1, 2, 0),
        (v_character_id, 'Cure Light Wounds', 1, 1, 0),
        (v_character_id, 'Enlarge Person', 1, 1, 0),
        (v_character_id, 'Invisibility', 2, 1, 0),
        (v_character_id, 'Bull''s Strength', 2, 1, 0)
    ON CONFLICT (character_id, extract_name) DO NOTHING;

    -- 25) Insert vampire corruption
    INSERT INTO character_corruptions 
        (character_id, corruption_type, manifestation_level, blood_required) 
    VALUES 
        (v_character_id, 'vampirism', 5, 5)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_corruption_id;

    -- 26) Insert vampire manifestations
    IF v_corruption_id IS NOT NULL THEN
      INSERT INTO character_corruption_manifestations 
          (character_id, corruption_id, manifestation_name, min_manifestation_level, prerequisite_manifestation) 
      VALUES
          (v_character_id, v_corruption_id, 'Vampiric Grace', 1, NULL),
          (v_character_id, v_corruption_id, 'Fangs', 2, NULL),
          (v_character_id, v_corruption_id, 'Unlife', 3, NULL),
          (v_character_id, v_corruption_id, 'Greater Unlife', 4, 'Unlife'),
          (v_character_id, v_corruption_id, 'True Unlife', 5, 'Greater Unlife')
      ON CONFLICT DO NOTHING;
    END IF;

    -- 27) Insert FCB choices
    INSERT INTO character_favored_class_bonuses (character_id, level, choice) VALUES
        (v_character_id, 1, 'skill'),
        (v_character_id, 2, 'skill'),
        (v_character_id, 3, 'skill'),
        (v_character_id, 4, 'skill'),
        (v_character_id, 5, 'skill')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created (or updated) Vardon Salvador with ID: %', v_character_id;
END $$;


-- ==================================
-- PART 5B: CREATE "Kiliq Said" (Kineticist/Oread)
-- ==================================
DO $$ 
DECLARE
    v_user_uuid UUID;
    v_character_id BIGINT;
    v_oread_id BIGINT;
    v_char_name TEXT;
    v_existing_char_id BIGINT;

    -- Feat IDs
    v_ius_id BIGINT;
    v_power_attack_id BIGINT;
    v_weapon_focus_unarmed_id BIGINT;
    v_dodge_id BIGINT;
BEGIN
    -- Set constants
    v_user_uuid := '9c4e4bb1-db8d-41df-b796-b9454622eed2'::UUID;
    v_char_name := 'Kiliq Said';

    -- 1) Check if this character already exists. If so, delete it to start fresh
    SELECT id INTO v_existing_char_id 
    FROM characters 
    WHERE name = v_char_name AND user_id = v_user_uuid;

    IF v_existing_char_id IS NOT NULL THEN
        DELETE FROM character_abp_bonuses     WHERE character_id = v_existing_char_id;
        DELETE FROM character_feats           WHERE character_id = v_existing_char_id;
        DELETE FROM character_discoveries     WHERE character_id = v_existing_char_id;
        DELETE FROM character_class_features  WHERE character_id = v_existing_char_id;
        DELETE FROM character_combat_stats    WHERE character_id = v_existing_char_id;
        DELETE FROM character_attributes      WHERE character_id = v_existing_char_id;
        DELETE FROM character_ancestries      WHERE character_id = v_existing_char_id;
        DELETE FROM characters                WHERE id = v_existing_char_id;
    END IF;

    -- 2) Upsert Oread ancestry
    INSERT INTO base_ancestries (
        name, 
        size, 
        base_speed, 
        ability_modifiers,
        description
    ) VALUES (
        'Oread',
        'Medium',
        30,
        '{"str": 2, "wis": 2, "cha": -2}'::jsonb,
        'Oreads are humans whose ancestry includes the touch of an elemental being of earth.'
    )
    ON CONFLICT (name) DO UPDATE 
    SET size = EXCLUDED.size,
        base_speed = EXCLUDED.base_speed,
        ability_modifiers = EXCLUDED.ability_modifiers,
        description = EXCLUDED.description
    RETURNING id INTO v_oread_id;

    -- 3) Create the character
    INSERT INTO characters (
        user_id, name, class, ancestry, level, current_hp, max_hp
    ) VALUES (
        v_user_uuid, v_char_name, 'Kineticist (Elemental Ascetic)', 'Oread', 5, 65, 65
    )
    RETURNING id INTO v_character_id;

    -- 4) Link ancestry
    INSERT INTO character_ancestries (character_id, ancestry_id, is_primary)
    VALUES (v_character_id, v_oread_id, true);

    -- 5) Insert attributes
    INSERT INTO character_attributes (character_id, str, dex, con, int, wis, cha, is_temporary) 
    VALUES (v_character_id, 16, 12, 14, 8, 12, 10, false);

    -- 6) Insert combat stats
    INSERT INTO character_combat_stats (character_id, base_attack_bonus) 
    VALUES (v_character_id, 3);

    -- 7) Insert class features
    INSERT INTO character_class_features (character_id, feature_name, feature_level, properties) VALUES 
        (v_character_id, 'Elemental Focus (Earth)', 1, '{"element": "earth"}'::jsonb),
        (v_character_id, 'Burn', 1, '{"max_burn": 6, "burn_per_round": 2}'::jsonb),
        (v_character_id, 'Gather Power', 1, '{"burn_reduction": 1}'::jsonb),
        (v_character_id, 'Kinetic Blast', 1, '{"damage": "2d6+3", "type": "physical"}'::jsonb),
        (v_character_id, 'Elemental Defense', 2, '{"name": "flesh_of_stone"}'::jsonb),
        (v_character_id, 'Elemental Overflow', 3, '{"bonus": 1}'::jsonb),
        (v_character_id, 'Infusion Specialization', 5, '{"level": 1}'::jsonb),
        (v_character_id, 'Metakinesis', 5, '{"type": "empower"}'::jsonb);

    -- 8) Insert "wild talents" as discoveries for brevity
    INSERT INTO character_discoveries (character_id, discovery_name, selected_level) VALUES
        (v_character_id, 'Basic Geokinesis', 1),
        (v_character_id, 'Kinetic Fist', 1),
        (v_character_id, 'Earth Walk', 2),
        (v_character_id, 'Tremorsense', 4);

    -- 9) Insert feats into base_feats if missing
    INSERT INTO base_feats (name, label, description, feat_type)
    VALUES
      ('Improved Unarmed Strike', 'Improved Unarmed Strike', 'Considered armed when unarmed', 'bonus'),
      ('Power Attack', 'Power Attack', 'Trade melee attack bonus for damage', 'combat'),
      ('Weapon Focus (Unarmed Strike)', 'Weapon Focus (Unarmed Strike)', 'Gain +1 attack bonus with unarmed strikes', 'combat'),
      ('Dodge', 'Dodge', '+1 dodge bonus to AC', 'combat')
    ON CONFLICT (name) DO NOTHING;

    -- 10) Get their IDs
    SELECT id INTO v_ius_id         FROM base_feats WHERE name='Improved Unarmed Strike';
    SELECT id INTO v_power_attack_id FROM base_feats WHERE name='Power Attack';
    SELECT id INTO v_weapon_focus_unarmed_id FROM base_feats WHERE name='Weapon Focus (Unarmed Strike)';
    SELECT id INTO v_dodge_id       FROM base_feats WHERE name='Dodge';

    -- 11) Link feats to this character
    INSERT INTO character_feats (character_id, base_feat_id, selected_level) VALUES
        (v_character_id, v_ius_id, 1),
        (v_character_id, v_power_attack_id, 1),
        (v_character_id, v_weapon_focus_unarmed_id, 3),
        (v_character_id, v_dodge_id, 5);

    -- 12) Insert ABP bonuses
    INSERT INTO character_abp_bonuses (character_id, bonus_type, value) VALUES
        (v_character_id, 'resistance', 1),
        (v_character_id, 'armor_attunement', 1),
        (v_character_id, 'weapon_attunement', 1),
        (v_character_id, 'deflection', 1),
        (v_character_id, 'mental_prowess', 2),
        (v_character_id, 'physical_prowess', 2);

    -- 13) Distribute skill ranks
    PERFORM distribute_skill_ranks(v_character_id, ARRAY[
        ('Acrobatics',            '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Perception',            '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Stealth',               '{1,1,1,1,1}'::INTEGER[])::skill_progression,
        ('Climb',                 '{1,1,0,0,0}'::INTEGER[])::skill_progression,
        ('Knowledge (Dungeoneering)', '{0,0,1,1,1}'::INTEGER[])::skill_progression
    ]);

    -- 14) Add class skill relations for Kineticist (if missing)
    INSERT INTO class_skill_relations (class_name, skill_id)
    SELECT 'Kineticist', id FROM base_skills
    WHERE name IN (
        'Acrobatics',
        'Craft',
        'Heal',
        'Intimidate',
        'Perception',
        'Profession',
        'Stealth',
        'Use Magic Device'
    )
    ON CONFLICT (class_name, skill_id) DO NOTHING;

    RAISE NOTICE 'Created character Kiliq Said with ID: %', v_character_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    RAISE;
END $$;


-- ==================================
-- PART 6: REALTIME ENABLEMENT & POLICIES
-- ==================================

-- 6.1) Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE character_attributes;
ALTER PUBLICATION supabase_realtime ADD TABLE character_combat_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE character_consumables;
ALTER PUBLICATION supabase_realtime ADD TABLE character_abp_bonuses;
ALTER PUBLICATION supabase_realtime ADD TABLE character_equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE character_class_features;
ALTER PUBLICATION supabase_realtime ADD TABLE character_discoveries;
ALTER PUBLICATION supabase_realtime ADD TABLE character_feats;
ALTER PUBLICATION supabase_realtime ADD TABLE character_buffs;
ALTER PUBLICATION supabase_realtime ADD TABLE character_spell_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE character_known_spells;
ALTER PUBLICATION supabase_realtime ADD TABLE character_extracts;
ALTER PUBLICATION supabase_realtime ADD TABLE character_corruptions;
ALTER PUBLICATION supabase_realtime ADD TABLE character_corruption_manifestations;
ALTER PUBLICATION supabase_realtime ADD TABLE base_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE class_skill_relations;
ALTER PUBLICATION supabase_realtime ADD TABLE character_skill_ranks;
ALTER PUBLICATION supabase_realtime ADD TABLE character_favored_class_bonuses;
ALTER PUBLICATION supabase_realtime ADD TABLE base_traits;
ALTER PUBLICATION supabase_realtime ADD TABLE base_ancestries;
ALTER PUBLICATION supabase_realtime ADD TABLE base_ancestral_traits;
ALTER PUBLICATION supabase_realtime ADD TABLE character_traits;
ALTER PUBLICATION supabase_realtime ADD TABLE character_ancestries;
ALTER PUBLICATION supabase_realtime ADD TABLE character_ancestral_traits;
ALTER PUBLICATION supabase_realtime ADD TABLE base_buffs;
ALTER PUBLICATION supabase_realtime ADD TABLE base_feats;

-- 6.2) Create a generic "Public realtime access" policy for each table
CREATE POLICY "Public realtime access"
    ON characters FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_attributes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_combat_stats FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_consumables FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_buffs FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_abp_bonuses FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_equipment FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_class_features FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_discoveries FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_feats FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_spell_slots FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_known_spells FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_extracts FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_corruptions FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_corruption_manifestations FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON base_skills FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON class_skill_relations FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_skill_ranks FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_favored_class_bonuses FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON base_traits FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON base_ancestries FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON base_ancestral_traits FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_traits FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_ancestries FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON character_ancestral_traits FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON base_buffs FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public realtime access"
    ON base_feats FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6.3) Enable full replica identity for all tables
ALTER TABLE characters REPLICA IDENTITY FULL;
ALTER TABLE character_attributes REPLICA IDENTITY FULL;
ALTER TABLE character_combat_stats REPLICA IDENTITY FULL;
ALTER TABLE character_consumables REPLICA IDENTITY FULL;
ALTER TABLE character_buffs REPLICA IDENTITY FULL;
ALTER TABLE character_abp_bonuses REPLICA IDENTITY FULL;
ALTER TABLE character_equipment REPLICA IDENTITY FULL;
ALTER TABLE character_class_features REPLICA IDENTITY FULL;
ALTER TABLE character_discoveries REPLICA IDENTITY FULL;
ALTER TABLE character_feats REPLICA IDENTITY FULL;
ALTER TABLE character_spell_slots REPLICA IDENTITY FULL;
ALTER TABLE character_known_spells REPLICA IDENTITY FULL;
ALTER TABLE character_extracts REPLICA IDENTITY FULL;
ALTER TABLE character_corruptions REPLICA IDENTITY FULL;
ALTER TABLE character_corruption_manifestations REPLICA IDENTITY FULL;
ALTER TABLE base_skills REPLICA IDENTITY FULL;
ALTER TABLE class_skill_relations REPLICA IDENTITY FULL;
ALTER TABLE character_skill_ranks REPLICA IDENTITY FULL;
ALTER TABLE character_favored_class_bonuses REPLICA IDENTITY FULL;
ALTER TABLE base_traits REPLICA IDENTITY FULL;
ALTER TABLE base_ancestries REPLICA IDENTITY FULL;
ALTER TABLE base_ancestral_traits REPLICA IDENTITY FULL;
ALTER TABLE character_traits REPLICA IDENTITY FULL;
ALTER TABLE character_ancestries REPLICA IDENTITY FULL;
ALTER TABLE character_ancestral_traits REPLICA IDENTITY FULL;
ALTER TABLE base_buffs REPLICA IDENTITY FULL;
ALTER TABLE base_feats REPLICA IDENTITY FULL;

-- Done!
