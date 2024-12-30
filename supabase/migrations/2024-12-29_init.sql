DROP TABLE IF EXISTS character_skill_ranks CASCADE;
DROP TABLE IF EXISTS character_rpg_entities CASCADE;
DROP TABLE IF EXISTS character_entity_choices CASCADE;
DROP TABLE IF EXISTS entity_choices CASCADE;
DROP TABLE IF EXISTS archetype_feature_replacements CASCADE;
DROP TABLE IF EXISTS entity_prerequisites CASCADE;
DROP TABLE IF EXISTS conditional_bonuses CASCADE;
DROP TABLE IF EXISTS natural_attacks CASCADE;
DROP TABLE IF EXISTS weapon_proficiencies CASCADE;
DROP TABLE IF EXISTS skill_bonuses CASCADE;
DROP TABLE IF EXISTS base_corruptions CASCADE;
DROP TABLE IF EXISTS base_traits CASCADE;
DROP TABLE IF EXISTS base_buffs CASCADE;
DROP TABLE IF EXISTS base_ancestral_traits CASCADE;
DROP TABLE IF EXISTS base_archetypes CASCADE;
DROP TABLE IF EXISTS base_class_features CASCADE;
DROP TABLE IF EXISTS base_feats CASCADE;
DROP TABLE IF EXISTS rpg_entities CASCADE;

DROP TABLE IF EXISTS character_consumables CASCADE;
DROP TABLE IF EXISTS character_equipment_properties CASCADE;
DROP TABLE IF EXISTS character_equipment CASCADE;
DROP TABLE IF EXISTS character_attributes CASCADE;

DROP TABLE IF EXISTS class_skill_relations CASCADE;
DROP TABLE IF EXISTS base_skills CASCADE;
DROP TABLE IF EXISTS base_classes CASCADE;
DROP TABLE IF EXISTS ancestry_ability_modifiers CASCADE;
DROP TABLE IF EXISTS base_ancestries CASCADE;
DROP TABLE IF EXISTS characters CASCADE;

DROP TABLE IF EXISTS favored_class_choices CASCADE;
DROP TABLE IF EXISTS abp_bonus_types CASCADE;
DROP TABLE IF EXISTS buff_types CASCADE;
DROP TABLE IF EXISTS skill_rank_sources CASCADE;
DROP TABLE IF EXISTS bonus_types CASCADE;


---------------------------------------------------------------------------
-- 1) REFERENCE TABLES
---------------------------------------------------------------------------


CREATE TABLE bonus_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skill_rank_sources (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE buff_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE abp_bonus_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE favored_class_choices (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 2) CHARACTERS, ANCESTRIES, CLASSES, SKILLS
---------------------------------------------------------------------------
CREATE TABLE characters (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    class_name TEXT,
    ancestry_name TEXT,
    level INT NOT NULL DEFAULT 1,
    current_hp INT NOT NULL DEFAULT 0,
    max_hp INT NOT NULL DEFAULT 0,
    archetype_name TEXT,
    is_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_ancestries (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    size TEXT NOT NULL,
    base_speed INT NOT NULL DEFAULT 30,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ancestry_ability_modifiers (
    id BIGSERIAL PRIMARY KEY,
    ancestry_id BIGINT NOT NULL REFERENCES base_ancestries(id) ON DELETE CASCADE,
    ability_name TEXT NOT NULL,
    modifier INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_classes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_skills (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    ability TEXT NOT NULL,
    trained_only BOOLEAN DEFAULT FALSE,
    armor_check_penalty BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_skill_relations (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES base_classes(id) ON DELETE CASCADE,
    skill_id BIGINT REFERENCES base_skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, skill_id)
);

---------------------------------------------------------------------------
-- 3) CHARACTER ATTRIBUTES, EQUIPMENT, CONSUMABLES, ETC.
---------------------------------------------------------------------------
CREATE TABLE character_attributes (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    str INT NOT NULL DEFAULT 10,
    dex INT NOT NULL DEFAULT 10,
    con INT NOT NULL DEFAULT 10,
    int INT NOT NULL DEFAULT 10,
    wis INT NOT NULL DEFAULT 10,
    cha INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE character_equipment (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    equipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE character_equipment_properties (
    id BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT NOT NULL REFERENCES character_equipment(id) ON DELETE CASCADE,
    property_key TEXT NOT NULL,
    property_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE character_consumables (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    consumable_type TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 4) THE SUPERTYPE: rpg_entities
---------------------------------------------------------------------------
CREATE TABLE rpg_entities (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 5) SUBTYPES
---------------------------------------------------------------------------
CREATE TABLE base_feats (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    feat_label TEXT,
    feat_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_class_features (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES base_classes(id),
    feature_level INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_archetypes (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES base_classes(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_ancestral_traits (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    ancestry_name TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_buffs (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    buff_type_id BIGINT REFERENCES buff_types(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_traits (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    trait_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_corruptions (
    id BIGINT PRIMARY KEY REFERENCES rpg_entities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 6) BRIDGING TABLES FOR "EFFECTS" (Skill Bonuses, Natural Attacks, etc.)
---------------------------------------------------------------------------
CREATE TABLE skill_bonuses (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    bonus INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weapon_proficiencies (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    weapon_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE natural_attacks (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    attack_type TEXT NOT NULL,
    damage TEXT NOT NULL,
    attack_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conditional_bonuses (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    bonus_type_id BIGINT NOT NULL REFERENCES bonus_types(id),
    value INT NOT NULL,
    apply_to TEXT NOT NULL,
    condition TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 7) PREREQUISITES & ARCHETYPE REPLACEMENTS
---------------------------------------------------------------------------
CREATE TABLE entity_prerequisites (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    required_entity_id BIGINT REFERENCES rpg_entities(id) ON DELETE CASCADE,
    prereq_type TEXT,
    prereq_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE archetype_feature_replacements (
    id BIGSERIAL PRIMARY KEY,
    archetype_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    replaced_feature_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    new_feature_id BIGINT REFERENCES rpg_entities(id) ON DELETE CASCADE,
    replacement_level INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 8) CHOICE-BASED LOGIC (Two-tier bridging)
---------------------------------------------------------------------------
CREATE TABLE entity_choices (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    choice_key TEXT NOT NULL,
    choice_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE character_entity_choices (
    id BIGSERIAL PRIMARY KEY,
    character_entity_id BIGINT NOT NULL,
    choice_key TEXT NOT NULL,
    choice_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Note: 'character_entity_id' references the row in 'character_rpg_entities' (defined below)

---------------------------------------------------------------------------
-- 9) CHARACTERS -> ENTITIES
---------------------------------------------------------------------------
CREATE TABLE character_rpg_entities (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    entity_id BIGINT NOT NULL REFERENCES rpg_entities(id) ON DELETE CASCADE,
    selected_level INT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------------------------------------------
-- 10) SKILL RANKS
---------------------------------------------------------------------------
CREATE TABLE character_skill_ranks (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES base_skills(id) ON DELETE CASCADE,
    source_id BIGINT REFERENCES skill_rank_sources(id),
    applied_at_level INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- 1) Required helper functions
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_entity_type_matches()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM 1
      FROM rpg_entities
     WHERE id = NEW.id
       AND entity_type = TG_ARGV[0];

    IF NOT FOUND THEN
        RAISE EXCEPTION 'rpg_entities row % is not typed as %', NEW.id, TG_ARGV[0];
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_multiple_entity_types()
RETURNS TRIGGER AS $$
DECLARE
    pairs TEXT[] := TG_ARGV;
    pair TEXT;
    col_name TEXT;
    req_type TEXT;
    actual_id BIGINT;
    dyn_sql TEXT;
BEGIN
    FOREACH pair IN ARRAY pairs
    LOOP
        SELECT split_part(pair,'=',1),
               split_part(pair,'=',2)
          INTO col_name, req_type;

        dyn_sql := format('SELECT ($1).%I::bigint', col_name);
        EXECUTE dyn_sql USING NEW INTO actual_id;

        IF actual_id IS NULL THEN
            CONTINUE;
        END IF;

        PERFORM 1 
          FROM rpg_entities
         WHERE id = actual_id
           AND entity_type = req_type;

        IF NOT FOUND THEN
           RAISE EXCEPTION 'Column % => rpg_entities row % is not typed as %, in table %', 
                           col_name, actual_id, req_type, TG_TABLE_NAME;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------
-- 2) Combine all dynamic trigger/policy creation into one DO block
-------------------------------------------------------------------------------
DO $$
DECLARE
    ---------------------------------------------------------------------------
    -- (A) ALL TABLES (for realtime, update_timestamp, etc.)
    ---------------------------------------------------------------------------
    all_tables TEXT[] := ARRAY[
      'bonus_types','skill_rank_sources','buff_types','abp_bonus_types','favored_class_choices',
      'characters','base_ancestries','ancestry_ability_modifiers','base_classes',
      'base_skills','class_skill_relations','character_attributes','character_equipment',
      'character_equipment_properties','character_consumables','rpg_entities',
      'base_feats','base_class_features','base_archetypes','base_ancestral_traits',
      'base_buffs','base_traits','base_corruptions','skill_bonuses','weapon_proficiencies',
      'natural_attacks','conditional_bonuses','entity_prerequisites',
      'archetype_feature_replacements','entity_choices','character_entity_choices',
      'character_rpg_entities','character_skill_ranks'
    ];

    ---------------------------------------------------------------------------
    -- (B) Subtype combos for ensure_entity_type_matches(_required TEXT)
    ---------------------------------------------------------------------------
    combos_subtypes TEXT[][] := ARRAY[
      ARRAY['base_feats','feat'],
      ARRAY['base_class_features','class_feature'],
      ARRAY['base_archetypes','archetype'],
      ARRAY['base_ancestral_traits','ancestral_trait'],
      ARRAY['base_buffs','buff'],
      ARRAY['base_traits','trait'],
      ARRAY['base_corruptions','corruption']
      -- Add more if you have additional subtypes
    ];

    ---------------------------------------------------------------------------
    -- (C) Pairs for ensure_multiple_entity_types(_pairs TEXT[])
    ---------------------------------------------------------------------------
    combos_multiples TEXT[][] := ARRAY[
      -- Table name, Trigger name, Pairs array
      ARRAY[
         'archetype_feature_replacements',
         'trg_archetype_feature_replacements_check',
         'archetype_id=archetype,replaced_feature_id=class_feature'
      ],
      ARRAY[
         'entity_prerequisites',
         'trg_entity_prerequisites_check',
         'entity_id=feat,required_entity_id=feat'
         -- Example: only feats requiring feats, but expand as needed
      ]
    ];

    t TEXT;
    c TEXT[];
    t_table TEXT;
    t_trigger TEXT;
    t_pairs TEXT;
BEGIN
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
    -- (2) Generate subtype triggers for each table requiring a specific entity_type
    ---------------------------------------------------------------------------
    FOREACH c SLICE 1 IN ARRAY combos_subtypes
    LOOP
        EXECUTE format(
          $f$
            CREATE TRIGGER trg_ensure_%1$I_type
            BEFORE INSERT OR UPDATE ON %1$I
            FOR EACH ROW
            EXECUTE PROCEDURE ensure_entity_type_matches('%2$s');
          $f$, c[1], c[2]
        );
    END LOOP;

    ---------------------------------------------------------------------------
    -- (3) Generate triggers for multiple entity-type checks
    ---------------------------------------------------------------------------
    FOREACH c SLICE 1 IN ARRAY combos_multiples
    LOOP
        t_table  := c[1];
        t_trigger := c[2];
        t_pairs   := c[3];

        EXECUTE format($f$
          CREATE TRIGGER %I
          BEFORE INSERT OR UPDATE ON %I
          FOR EACH ROW
          EXECUTE PROCEDURE ensure_multiple_entity_types(%L)
        $f$, t_trigger, t_table, t_pairs);
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
