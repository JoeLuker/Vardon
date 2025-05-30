-- ===========================================================================
--  DROP SCHEMAS 
-- ===========================================================================
-- Drop only our application-specific schemas with CASCADE to clean everything up
DROP SCHEMA IF EXISTS core CASCADE;
DROP SCHEMA IF EXISTS subsystems CASCADE;
DROP SCHEMA IF EXISTS features CASCADE;
DROP SCHEMA IF EXISTS shared CASCADE;
DROP SCHEMA IF EXISTS config CASCADE;
DROP SCHEMA IF EXISTS state CASCADE;
DROP SCHEMA IF EXISTS extensions CASCADE;
DROP SCHEMA IF EXISTS introspection CASCADE;

-- Drop publication
DROP PUBLICATION IF EXISTS suparealtime;

-- ===========================================================================
-- CREATE SCHEMAS USING OUR MAPPED TERMINOLOGY
-- ===========================================================================
-- CREATE SCHEMA core;           -- Central system (was kernel)
-- CREATE SCHEMA subsystems;     -- System functionality interfaces (was dev)
-- CREATE SCHEMA features;       -- Executable components (was bin)
-- CREATE SCHEMA shared;         -- Implementation libraries (was lib)
-- CREATE SCHEMA config;         -- Configuration files (was etc)
-- CREATE SCHEMA state;          -- Runtime state and data (was proc/var)
-- CREATE SCHEMA extensions;     -- User extensions (was usr)
-- CREATE SCHEMA introspection;  -- System information (was sys)

-- ===========================================================================
-- SYSTEM TABLES - CORE ENGINE
-- ===========================================================================

-- Entity registry
create table
  public.entity (
    id BIGSERIAL primary key,
    type TEXT NOT NULL,         -- 'character', 'npc', 'item', etc.
    ref_id BIGINT NOT NULL,     -- ID in the respective table
    name TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now(),
    UNIQUE(type, ref_id)
  );

-- Subsystem registry
create table
  public.subsystem_registry (
    id BIGSERIAL primary key,
    name TEXT NOT NULL UNIQUE,  -- e.g. 'ability', 'skill', 'combat'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Process tracking (active features)
create table
  public.active_feature (
    id BIGSERIAL primary key,
    entity_id BIGINT NOT NULL REFERENCES public.entity(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- 'feat', 'class_feature', 'racial_trait', etc.
    feature_id BIGINT NOT NULL, -- ID in the respective table
    feature_path TEXT NOT NULL, -- e.g. 'feats.power_attack', 'class.barbarian.rage'
    options JSONB,              -- Feature activation options
    state JSONB,                -- Current feature state
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ, -- NULL if still active
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Event log
create table
  public.event_log (
    id BIGSERIAL primary key,
    event_type TEXT NOT NULL,   -- e.g. 'entity:modified', 'feature:activated'
    entity_id BIGINT REFERENCES public.entity(id) ON DELETE SET NULL,
    data JSONB,                 -- Event data
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Persistent entity metadata
create table
  public.entity_metadata (
    id BIGSERIAL primary key,
    entity_id BIGINT NOT NULL REFERENCES public.entity(id) ON DELETE CASCADE,
    metadata_key TEXT NOT NULL, -- Metadata key (like environment variables)
    metadata_value JSONB,       -- Value (can be complex data)
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now(),
    UNIQUE(entity_id, metadata_key)
  );

-- ===========================================================================
-- REFERENCE TABLES - CONFIG SCHEMA  
-- ===========================================================================

create table
  public.bonus_attack_progression (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.bonus_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    stacking boolean default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.abp_bonus_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.favored_class_choice (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.ability (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    ability_type text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.legendary_gift_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- ===========================================================================
-- CHARACTER TABLES - REPRESENT ENTITIES
-- ===========================================================================
create table
  public.game_character (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    user_id uuid not null,
    current_hp int not null default 0,
    max_hp int not null default 0,
    is_offline boolean default false,
    entity_type TEXT NOT NULL DEFAULT 'character',
    metadata JSONB,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.ancestry (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    size text not null default 'Medium',
    speed int not null default 30,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.class (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    description text,
    hit_die int,
    base_attack_bonus_progression bigint references public.bonus_attack_progression (id),
    skill_ranks_per_level int,
    fortitude text,
    reflex text,
    will text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.skill (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    ability_id bigint not null references public.ability (id) on delete cascade,
    trained_only boolean default false,
    armor_check_penalty boolean default false,
    knowledge_skill boolean default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- FEAT = EXECUTABLE FEATURE
create table
  public.feat (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    feat_type text,
    is_toggleable boolean default false,
    description text,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    persistent BOOLEAN DEFAULT FALSE,     -- Persists after activation
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- CLASS FEATURE = EXECUTABLE FEATURE
create table
  public.class_feature (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    type text,
    description text,
    class_id bigint references public.class (id),
    feature_level int,
    is_toggleable boolean default false,
    is_limited boolean default false,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems 
    persistent BOOLEAN DEFAULT FALSE,     -- Persists after activation
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.class_feature_benefit (
    id BIGSERIAL primary key,
    class_feature_id bigint not null references public.class_feature (id) on delete cascade,
    name text not null,
    label text,
    feature_level int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spellcasting_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.spell_progression_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    max_spell_level bigint not null,
    is_spontaneous boolean not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.spell_progression (
    id BIGSERIAL primary key,
    progression_type_id bigint not null references public.spell_progression_type (id) on delete cascade,
    class_level int not null,
    spell_level int not null,
    slots int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spellcasting_class_feature (
    id BIGSERIAL primary key,
    class_feature_id bigint not null references public.class_feature (id) on delete cascade,
    progression_type_id bigint not null references public.spell_progression_type (id) on delete cascade,
    spellcasting_type_id bigint not null references public.spellcasting_type (id) on delete cascade,
    ability_id bigint not null references public.ability (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.archetype (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    class_id bigint references public.class (id),
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.archetype_class_feature (
    id BIGSERIAL primary key,
    class_id bigint not null references public.class (id) on delete cascade,
    archetype_id bigint not null references public.archetype (id) on delete cascade,
    feature_id bigint not null references public.class_feature (id) on delete cascade,
    feature_level int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.trait (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    trait_type text,
    description text,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.corruption (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    corruption_stage int,
    manifestation_level int,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.corruption_manifestation (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    corruption_id bigint not null references public.corruption (id) on delete cascade,
    min_manifestation_level int not null default 1,
    description text,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.corruption_manifestation_prerequisite (
    id BIGSERIAL primary key,
    corruption_manifestation_id bigint not null references public.corruption_manifestation (id) on delete cascade,
    prerequisite_manifestation_id bigint not null references public.corruption_manifestation (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.element (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    energy_type text,
    base_skill text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.discovery (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    discovery_level int,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.wild_talent_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.wild_talent (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    class_id bigint references public.class (id),
    wild_talent_type_id bigint references public.wild_talent_type (id),
    level int,
    burn int,
    associated_blasts text,
    saving_throw text,
    description text,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.monk_unchained_ki_power (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    class_id bigint references public.class (id),
    type text,
    min_level int,
    description text,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.equipment (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    equipment_category text,
    equippable boolean default false,
    slot text,
    bonus int,
    bonus_type_id bigint references public.bonus_type (id) on delete cascade,
    weight numeric,
    cost numeric,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.weapon (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    damage_die_count int not null default 1,
    damage_die_size int not null default 4,
    crit_range int not null default 20,
    crit_mult int not null default 2,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    source text,
    description text,
    feature_path TEXT,                    -- Path identifier
    required_subsystems TEXT[],           -- Required subsystems
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_consumable (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    spell_id bigint references public.spell (id),
    caster_level int,
    cost numeric,
    weight numeric,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_class (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    class_id bigint not null references public.class (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.class_skill (
    id BIGSERIAL primary key,
    class_id bigint not null references public.class (id) on delete cascade,
    skill_id bigint not null references public.skill (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_skill_rank (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    skill_id bigint not null references public.skill (id) on delete cascade,
    applied_at_level int not null default 1,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now(),
    CONSTRAINT unique_game_character_skill_level UNIQUE (game_character_id, skill_id, applied_at_level)
  );

create table
  public.game_character_ability (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    ability_id bigint not null references public.ability (id) on delete cascade,
    value int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_feat (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    feat_id bigint not null references public.feat (id) on delete cascade,
    level_obtained int,
    is_active boolean not null default true,
    activation_state JSONB,               -- Current state if active
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.armor (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    armor_type text not null,
    armor_bonus int not null,
    max_dex int,
    arcane_spell_failure_chance int,
    armor_check_penalty int,
    weight numeric,
    price numeric,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.consumable (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    cost numeric,
    weight numeric,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_consumable (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    consumable_id bigint not null references public.consumable (id) on delete cascade,
    quantity int not null default 0,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_archetype (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    archetype_id bigint not null references public.archetype (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_ancestry (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    ancestry_id bigint not null references public.ancestry (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_class_feature (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    class_feature_id bigint not null references public.class_feature (id) on delete cascade,
    level_obtained int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_corruption (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    corruption_id bigint not null references public.corruption (id) on delete cascade,
    corruption_stage int not null default 0,
    manifestation_level int not null default 0,
    blood_required int not null default 0,
    blood_consumed int not null default 0,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_corruption_manifestation (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    manifestation_id bigint not null references public.corruption_manifestation (id) on delete cascade,
    active boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_wild_talent (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    wild_talent_id bigint not null references public.wild_talent (id) on delete cascade,
    level_obtained int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.abp_node_group (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    level int not null,
    requires_choice boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.abp_node (
    id BIGSERIAL primary key,
    group_id bigint not null references public.abp_node_group (id) on delete cascade,
    name text not null unique,
    label text,
    description text,
    requires_choice boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.abp_node_bonus (
    id BIGSERIAL primary key,
    node_id bigint not null references public.abp_node (id) on delete cascade,
    bonus_type_id bigint not null references public.abp_bonus_type (id) on delete cascade,
    value int not null,
    target_specifier text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_abp_choice (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    group_id bigint not null references public.abp_node_group (id) on delete cascade,
    node_id bigint not null references public.abp_node (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_favored_class_bonus (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    choice_id bigint not null references public.favored_class_choice (id) on delete cascade,
    class_id bigint not null references public.class (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_equipment (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    equipment_id bigint not null references public.equipment (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_armor (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    armor_id bigint not null references public.armor (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_trait (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    trait_id bigint not null references public.trait (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_spell (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    spell_id bigint not null references public.spell (id) on delete cascade,
    level int not null,
    prepared int not null default 0,
    used int not null default 0,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_discovery (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    discovery_id bigint not null references public.discovery (id) on delete cascade,
    level_obtained int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_weapon (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    weapon_id bigint not null references public.weapon (id) on delete cascade,
    enhancement int not null default 0,
    masterwork boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.subdomain (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.sorcerer_bloodline (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_school (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_component_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    abbreviation text,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_component (
    id BIGSERIAL primary key,
    type_id bigint not null references public.spell_component_type (id) on delete cascade,
    description text,
    cost numeric,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_casting_time (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_range (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_target (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_duration (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_list (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_component_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_component_id bigint not null references public.spell_component (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_sorcerer_bloodline_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    sorcerer_bloodline_id bigint not null references public.sorcerer_bloodline (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_subdomain_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    subdomain_id bigint not null references public.subdomain (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_school_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_school_id bigint not null references public.spell_school (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_casting_time_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_casting_time_id bigint not null references public.spell_casting_time (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_range_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_range_id bigint not null references public.spell_range (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_target_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_target_id bigint not null references public.spell_target (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_duration_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_duration_id bigint not null references public.spell_duration (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_list_class_feature_benefit_mapping (
    id BIGSERIAL primary key,
    spell_list_id bigint not null references public.spell_list (id) on delete cascade,
    class_feature_benefit_id bigint not null references public.class_feature_benefit (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_list_feat_mapping (
    id BIGSERIAL primary key,
    spell_list_id bigint not null references public.spell_list (id) on delete cascade,
    feat_id bigint not null references public.feat (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.spell_list_spell_mapping (
    id BIGSERIAL primary key,
    spell_id bigint not null references public.spell (id) on delete cascade,
    spell_list_id bigint not null references public.spell_list (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.prerequisite_requirement_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.prerequisite_requirement (
    id BIGSERIAL primary key,
    requirement_type_id bigint not null references public.prerequisite_requirement_type (id) on delete cascade,
    requirement_id bigint not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.prerequisite_fulfillment (
    id BIGSERIAL primary key,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.qualification_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.fulfillment_qualification_mapping (
    id BIGSERIAL primary key,
    fulfillment_id bigint not null references public.prerequisite_fulfillment (id) on delete cascade,
    qualification_type_id bigint not null references public.qualification_type (id) on delete cascade,
    qualification_id bigint not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.prerequisite_requirement_fulfillment_mapping (
    id BIGSERIAL primary key,
    prerequisite_requirement_id bigint not null references public.prerequisite_requirement (id) on delete cascade,
    prerequisite_fulfillment_id bigint not null references public.prerequisite_fulfillment (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.feat_benefit (
    id BIGSERIAL primary key,
    feat_id bigint not null references public.feat (id) on delete cascade,
    name text not null,
    label text,
    benefit text,
    school_id bigint references public.spell_school (id),
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.qinggong_monk_ki_power_type (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.rule (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    source text,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.qinggong_monk_ki_power (
    id BIGSERIAL primary key,
    power_id bigint not null,
    power_type_id bigint not null references public.qinggong_monk_ki_power_type (id) on delete cascade,
    class_id bigint not null references public.class (id) on delete cascade,
    type text,
    min_level integer not null,
    ki_cost integer not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.archetype_class_feature_replacement (
    id BIGSERIAL primary key,
    replaced_class_feature_id bigint not null references public.class_feature (id) on delete cascade,
    archetype_class_feature_id bigint not null references public.archetype_class_feature (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );
create table
  public.archetype_class_feature_alteration (
    id BIGSERIAL primary key,
    altered_class_feature_id bigint not null references public.class_feature (id) on delete cascade,
    archetype_class_feature_id bigint not null references public.archetype_class_feature (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.target_specifier (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );  

create table
  public.class_feature_benefit_bonus (
    id BIGSERIAL primary key,
    class_feature_benefit_id bigint not null references public.class_feature_benefit (id) on delete cascade,
    target_specifier_id bigint not null references public.target_specifier (id) on delete cascade,
    bonus_type_id bigint not null references public.bonus_type (id) on delete cascade,
    value int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.ancestry_trait (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    ancestry_id bigint not null references public.ancestry (id) on delete cascade,
    is_standard boolean not null default true,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.ancestry_trait_replacement (
    id BIGSERIAL primary key,
    replacing_trait_id bigint not null references public.ancestry_trait (id) on delete cascade,
    replaced_trait_id bigint not null references public.ancestry_trait (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.game_character_ancestry_trait (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    ancestry_trait_id bigint not null references public.ancestry_trait (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.ancestry_trait_benefit (
    id BIGSERIAL primary key,
    ancestry_trait_id bigint not null references public.ancestry_trait (id) on delete cascade,
    name text not null,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table 
  public.ancestry_trait_benefit_bonus (
    id BIGSERIAL primary key,
    ancestry_trait_benefit_id bigint not null references public.ancestry_trait_benefit (id) on delete cascade,
    target_specifier_id bigint not null references public.target_specifier (id) on delete cascade,
    bonus_type_id bigint not null references public.bonus_type (id) on delete cascade,
    value int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  public.game_character_spell_slot (
    id BIGSERIAL primary key,
    game_character_id bigint not null references public.game_character (id) on delete cascade,
    class_id bigint not null references public.class (id) on delete cascade,
    spell_level int not null,
    is_used boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- ===========================================================================
-- PUBLICATION AND TRIGGERS 
-- ===========================================================================
create publication suparealtime;

-- Helper function
create or replace function update_timestamp() returns trigger as $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

-- Dynamic triggers
do $$
DECLARE
    our_schemas TEXT[] := ARRAY['core', 'subsystems', 'features', 'shared', 'config', 'state', 'extensions', 'introspection', 'public'];
    all_tables TEXT[];
    s TEXT;
    t TEXT;
    fully_qualified TEXT;
BEGIN
    FOREACH s IN ARRAY our_schemas
    LOOP
        -- Get all tables in this schema
        SELECT array_agg(table_name)
          INTO all_tables
          FROM information_schema.tables
         WHERE table_schema = s
           AND table_type = 'BASE TABLE';
        
        IF all_tables IS NOT NULL THEN
            FOREACH t IN ARRAY all_tables
            LOOP
                fully_qualified := s || '.' || t;
                
                -- Create timestamp trigger
                EXECUTE format(
                    $f$
                      CREATE TRIGGER trg_%I_update
                      BEFORE UPDATE ON %s
                      FOR EACH ROW
                      EXECUTE PROCEDURE update_timestamp()
                    $f$, t, fully_qualified
                );
                
                -- Add to realtime publication
                EXECUTE format('ALTER PUBLICATION suparealtime ADD TABLE %s', fully_qualified);
                
                -- Create policy
                EXECUTE format($f$
                    CREATE POLICY "Public realtime access"
                    ON %s
                    FOR ALL
                    USING (true)
                    WITH CHECK (true)
                $f$, fully_qualified);
                
                -- Set replica identity
                EXECUTE format('ALTER TABLE %s REPLICA IDENTITY FULL', fully_qualified);
            END LOOP;
        END IF;
    END LOOP;
END;
$$;
