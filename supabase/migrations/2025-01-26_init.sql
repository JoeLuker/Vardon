-- ===========================================================================
--  DROP TABLES 
-- ===========================================================================
do $$
DECLARE
    all_tables TEXT[];
    t TEXT;

BEGIN

    SELECT array_agg(table_name)
      INTO all_tables
      FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE';

    FOREACH t IN ARRAY all_tables
    LOOP
        EXECUTE format(
            $f$
              DROP TABLE IF EXISTS %I CASCADE
            $f$, t, t
        );
    END LOOP;

END;
$$;

drop publication if exists SUPAREALTIME;

-- ===========================================================================
-- 1) REFERENCE TABLES (*)
-- ===========================================================================
create table
  bonus_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    stacking boolean default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  buff_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  abp_bonus_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  favored_class_choice (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  ability (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    ability_type text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  legendary_gift_type (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- ===========================================================================
-- 2) game_character
-- ===========================================================================
create table
  game_character (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    user_id uuid not null,
    current_hp int not null default 0,
    max_hp int not null default 0,
    is_offline boolean default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  ancestry (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    size text not null default 'Medium',
    speed int not null default 30,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  ancestry_ability (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    ancestry_id bigint not null references ancestry (id) on delete cascade,
    ability_id bigint not null references ability (id) on delete cascade,
    modifier int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  class (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    description text,
    hit_die int,
    skill_ranks_per_level int,
    fortitude text,
    reflex text,
    will text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  skill (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    ability_id bigint not null references ability (id) on delete cascade,
    trained_only boolean default false,
    armor_check_penalty boolean default false,
    knowledge_skill boolean default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  feat (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    feat_type text,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  class_feature (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    type text,
    description text,
    class_id bigint not null references class (id),
    feature_level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  archetype (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    class_id bigint references class (id),
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  archetype_class_feature (
    id BIGSERIAL primary key,
    class_id bigint not null references class (id) on delete cascade,
    archetype_id bigint not null references archetype (id) on delete cascade,
    feature_id bigint not null references class_feature (id) on delete cascade,
    level_obtained int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  ancestral_trait (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    ancestry_id bigint references ancestry (id) on delete cascade,
    is_optional boolean default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  buff (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    buff_type_id bigint references buff_type (id),
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  trait (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    trait_type text,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  corruption (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    corruption_stage int,
    manifestation_level int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  corruption_manifestation (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    corruption_id bigint not null references corruption (id) on delete cascade,
    min_manifestation_level int not null default 1,
    prerequisite_manifestation text,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  element (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    energy_type text,
    base_skill text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  discovery (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    discovery_level int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  wild_talent (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    element_id bigint references element (id) on delete cascade,
    type text,
    spell_level int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  equipment (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    equipment_category text, -- e.g. "weapon", "armor", "tool"
    equippable boolean default false,
    slot text,
    bonus int,
    bonus_type_id bigint references bonus_type (id) on delete cascade,
    weight numeric,
    cost numeric,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  skill_bonus (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    skill_name text not null,
    bonus int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  weapon_proficiency (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    weapon_name text not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  natural_attack (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    attack_type text not null,
    damage text not null,
    attack_count int default 1,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Weapons table for specific weapon properties
create table
  weapon (
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

-- Spells table for magic
create table
  spell (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    level int not null,
    school text,
    casting_time text,
    spell_range text,
    target text,
    duration text,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Add after the spell table definition
create table
  spell_consumable (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    spell_id bigint references spell (id),
    caster_level int,
    cost numeric,
    weight numeric,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Character-Class relationship table
create table
  game_character_class (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    class_id bigint not null references class (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Class skills bridging table
create table
  class_skill (
    id BIGSERIAL primary key,
    class_id bigint not null references class (id) on delete cascade,
    skill_id bigint not null references skill (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- ===========================================================================
-- 11) ARCHETYPE REPLACEMENTS
-- ===========================================================================
create table
  archetype_feature_replacement (
    id BIGSERIAL primary key,
    archetype_id bigint not null references archetype (id) on delete cascade,
    replaced_feature_id bigint not null references class_feature (id) on delete cascade,
    new_feature_id bigint references class_feature (id) on delete cascade,
    replacement_level int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- ===========================================================================
-- 12) game_character -> ENTITIES
-- ===========================================================================
create table
  game_character_skill_rank (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    skill_id bigint not null references skill (id) on delete cascade,
    applied_at_level int not null default 1,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Add new bridging tables
create table
  game_character_ability (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    ability_id bigint not null references ability (id) on delete cascade,
    value int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_feat (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    feat_id bigint not null references feat (id) on delete cascade,
    level_obtained int,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Add this before the CREATE PUBLICATION line
create table
  spell_extract (
    id BIGSERIAL primary key,
    name text not null,
    label text,
    level int,
    description text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );


-- Add this before the CREATE PUBLICATION line
create table
  armor (
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

-- Add this before the CREATE PUBLICATION line
create table
  consumable (
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
  game_character_consumable (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    consumable_id bigint not null references consumable (id) on delete cascade,
    quantity int not null default 0,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_archetype (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    archetype_id bigint not null references archetype (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_ancestry (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    ancestry_id bigint not null references ancestry (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_class_feature (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    class_feature_id bigint not null references class_feature (id) on delete cascade,
    level_obtained int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_corruption (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    corruption_id bigint not null references corruption (id) on delete cascade,
    corruption_stage int not null default 0,
    manifestation_level int not null default 0,
    blood_required int not null default 0,
    blood_consumed int not null default 0,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_corruption_manifestation (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    manifestation_id bigint not null references corruption_manifestation (id) on delete cascade,
    active boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_wild_talent (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    wild_talent_id bigint not null references wild_talent (id) on delete cascade,
    level_obtained int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Add these new tables after abp_bonus_type definition
------------------------------------------------------------------------------
-- ABP REFERENCE TABLES
------------------------------------------------------------------------------
create table
  abp_node_group (
    id BIGSERIAL primary key,
    name text not null unique,
    label text,
    level int not null,
    requires_choice boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  abp_node (
    id BIGSERIAL primary key,
    group_id bigint not null references abp_node_group (id) on delete cascade,
    name text not null unique,
    label text,
    description text,
    requires_choice boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  abp_node_bonus (
    id BIGSERIAL primary key,
    node_id bigint not null references abp_node (id) on delete cascade,
    bonus_type_id bigint not null references abp_bonus_type (id) on delete cascade,
    value int not null,
    target_specifier text,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_abp_choice (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    group_id bigint not null references abp_node_group (id) on delete cascade,
    node_id bigint not null references abp_node (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_favored_class_bonus (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    class_id bigint not null references class (id) on delete cascade,
    choice_id bigint not null references favored_class_choice (id) on delete cascade,
    level int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Add this before the CREATE PUBLICATION line
create table
  game_character_equipment (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    equipment_id bigint not null references equipment (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

-- Add this before the CREATE PUBLICATION line
create table
  game_character_armor (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    armor_id bigint not null references armor (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_trait (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    trait_id bigint not null references trait (id) on delete cascade,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_spell (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    spell_id bigint not null references spell (id) on delete cascade,
    level int not null,
    prepared int not null default 0,
    used int not null default 0,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_discovery (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    discovery_id bigint not null references discovery (id) on delete cascade,
    level_obtained int not null,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );

create table
  game_character_weapon (
    id BIGSERIAL primary key,
    game_character_id bigint not null references game_character (id) on delete cascade,
    weapon_id bigint not null references weapon (id) on delete cascade,
    enhancement int not null default 0,
    masterwork boolean not null default false,
    created_at TIMESTAMPTZ default now(),
    updated_at TIMESTAMPTZ default now()
  );


create publication suparealtime for all tables;

-- ===========================================================================
-- 16) HELPER FUNCTIONS
-- ===========================================================================
create
or replace function update_timestamp () returns trigger as $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

-- ===========================================================================
-- 17) DYNAMIC TRIGGERS & POLICIES
-- ===========================================================================
do $$
DECLARE
    all_tables TEXT[];
    t TEXT;
    c TEXT[];
    t_table TEXT;
    t_trigger TEXT;
    t_pairs TEXT;
BEGIN

    SELECT array_agg(table_name)
      INTO all_tables
      FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE';

    ---------------------------------------------------------------------------
    -- (1) Create BEFORE UPDATE triggers for update_timestamp() on each table
    ---------------------------------------------------------------------------
    FOREACH t IN ARRAY all_tables
    LOOP
        EXECUTE format(
            $f$
              CREATE TRIGGER trg_%I_update
              BEFORE UPDATE ON %I
              FOR EACH ROW
              EXECUTE PROCEDURE update_timestamp()
            $f$, t, t
        );
    END LOOP;

        ---------------------------------------------------------------------------
    -- (4) Supabase Realtime publication, open policy, REPLICA IDENTITY
    ---------------------------------------------------------------------------
    FOREACH t IN ARRAY all_tables
    LOOP
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);

        EXECUTE format($f$
            CREATE POLICY "Public realtime access"
            ON %I
            FOR ALL
            USING (true)
            WITH CHECK (true)
        $f$, t);

        EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', t);
    END LOOP;
    
END;
$$;