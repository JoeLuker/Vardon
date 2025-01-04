#!/usr/bin/env python3
"""
Full "everything is an entity" loader script that:
  - Loads all reference tables
  - Inserts supertypes (rpg_entities) & subtypes
  - Inserts bridging data for classes/skills
  - Inserts characters
  - Handles:
      abp_bonuses
      extracts
      favored_class_bonuses
      skill_ranks
      corruption + corruption manifestations
      equipment + consumables with properties
      etc.

Usage:
  python3 load_pathfinder_data.py data.yaml [--dry-run]

Notes / disclaimers:
 - You must adapt function names / table names to match your actual DB.
 - This script is a reference blueprint and likely needs custom tweaks for your environment.
 - Make sure your environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set or in .env.
 - The code uses 'supabase-py' (pip install supabase-py) and 'PyYAML' for the YAML.
 - Big thanks to you for using or customizing this!
"""

import os
from dotenv import load_dotenv
import yaml
from supabase import create_client, Client
import logging
import sys
import time
from typing import Optional, Dict, Any, List

# =============================================================================
# Configuration
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "<YOUR_PROJECT_URL>")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "<YOUR_ANON_KEY>")

DRY_RUN = "--dry-run" in sys.argv

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# =============================================================================
# Basic Utilities
# =============================================================================

def execute_insert(table_name: str, data: dict) -> Optional[dict]:
    """
    Perform an insert into the given table. If DRY_RUN is True, just log & do nothing.
    Returns the inserted row or None if DRY_RUN or error.
    """
    if DRY_RUN:
        logger.info(f"[DRY RUN] Insert into {table_name}: {data}")
        return None
    try:
        response = supabase.table(table_name).insert(data).execute()
        if response.data:
            return response.data[0]  # typically returns the newly inserted row
        return None
    except Exception as e:
        logger.error(f"Error inserting into {table_name}: {e}")
        raise

def load_yaml(file_path: str) -> dict:
    """Load YAML data from a file path."""
    logger.info(f"Loading YAML data from {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data
    except Exception as e:
        logger.error(f"Failed to load YAML file: {e}")
        raise

def batch_insert(table_name: str, items: List[Dict]) -> Optional[List[Dict]]:
    """
    Perform a batch insert into the given table.
    Returns the inserted rows or None if DRY_RUN or error.
    """
    if not items:
        return None
    
    if DRY_RUN:
        logger.info(f"[DRY RUN] Batch insert into {table_name}: {len(items)} items")
        return None
        
    try:
        response = supabase.table(table_name).insert(items).execute()
        if response.data:
            return response.data
        return None
    except Exception as e:
        logger.error(f"Error batch inserting into {table_name}: {e}")
        raise

# =============================================================================
# 1) Reference Tables
# =============================================================================

def insert_reference_tables(data: dict):
    """
    Insert all reference table data AND ensure they exist in rpg_entities
    """
    ref_tables = data.get("reference_tables", {})
    
    table_map = {
        "bonus_types": "bonus_types",
        "skill_rank_sources": "skill_rank_sources",
        "buff_types": "buff_types",
        "abp_bonus_types": "abp_bonus_types",
        "favored_class_choices": "favored_class_choices"
    }
    
    for yaml_key, table_name in table_map.items():
        items = ref_tables.get(yaml_key, [])
        if not isinstance(items, list) or not items:
            continue
            
        logger.info(f"Inserting {len(items)} rows into '{table_name}' and rpg_entities...")
        
        # Batch insert into rpg_entities
        entity_data = [{
            "id": item["id"],
            "name": item["name"], 
            "entity_type": table_name,
            "description": item.get("label", "")
        } for item in items]
        
        entity_rows = batch_insert("rpg_entities", entity_data)
        
        if entity_rows and not DRY_RUN:
            # Batch insert into reference table
            batch_insert(table_name, items)

# =============================================================================
# 2) Insert "entity + subtype" Helpers
# =============================================================================

def insert_into_rpg_entities(
    override_id: Optional[int],
    entity_type: str,
    name: str,
    description: str = ""
) -> Optional[int]:
    """
    Insert a row into rpg_entities with the given ID (override_id) or let the DB generate it.
    Return the new ID or None.
    """
    to_insert = {
        "id": override_id,
        "entity_type": entity_type,
        "name": name,
        "description": description
    }
    row = execute_insert("rpg_entities", to_insert)
    if row:
        return row.get("id")
    return None

def insert_entity_and_subtype(
    entity_type: str,
    entity_data: dict,
    subtype_table: str,
    subtype_data: dict
) -> Optional[int]:
    """
    1) Insert into rpg_entities with entity_type
    2) Insert into the subtype_table with same 'id'
    Return new ID or None
    """
    override_id = entity_data.get("id")
    name = entity_data.get("name", "")
    desc = entity_data.get("description", "")
    
    new_id = insert_into_rpg_entities(override_id, entity_type, name, desc)
    if not new_id:
        return None
    
    # Insert subtype
    subtype_insert = {"id": new_id}
    subtype_insert.update(subtype_data)
    execute_insert(subtype_table, subtype_insert)
    return new_id

# =============================================================================
# 3) Base Tables (Skills, Ancestries, etc.) from "base_tables"
# =============================================================================

def insert_skills_5nf(skills: list):
    logger.info(f"Inserting {len(skills)} skills => base_skills + rpg_entities(type='skill').")
    for skill in skills:
        entity_data = {
            "id": skill["id"],
            "name": skill["name"],
            "description": skill.get("description", "")
        }
        subtype_data = {
            "ability": skill["ability"],
            "trained_only": skill.get("trained_only", False),
            "armor_check_penalty": skill.get("armor_check_penalty", False)
        }
        insert_entity_and_subtype("skill", entity_data, "base_skills", subtype_data)

def insert_ancestries_5nf(ancestries: list):
    logger.info(f"Inserting {len(ancestries)} ancestries => base_ancestries + rpg_entities(type='ancestry').")
    for anc in ancestries:
        entity_data = {
            "id": anc["id"],
            "name": anc["name"],
            "description": anc.get("description", "")
        }
        subtype_data = {
            "size": anc.get("size", "Medium"),
            "base_speed": anc.get("base_speed", 30)
        }
        insert_entity_and_subtype("ancestry", entity_data, "base_ancestries", subtype_data)
        # If ancestry_ability_modifiers exist, you'd handle them here.

def insert_base_tables_5nf(data: dict):
    base = data.get("base_tables", {})
    
    # Insert attributes if present
    attributes = base.get("attributes", [])
    if attributes:
        logger.info(f"Inserting {len(attributes)} attributes => base_attributes + rpg_entities(type='attribute').")
        for attr in attributes:
            entity_data = {
                "id": attr["id"],
                "name": attr["name"],
                "description": f"{attr['name']} attribute"
            }
            subtype_data = {
                "attribute_type": attr["attribute_type"]
            }
            insert_entity_and_subtype("attribute", entity_data, "base_attributes", subtype_data)
    
    # Insert skills if present
    skills = base.get("skills", [])
    if skills:
        insert_skills_5nf(skills)
        
    # Insert ancestries if present
    ancestries = base.get("ancestries", [])
    if ancestries:
        insert_ancestries_5nf(ancestries)

# =============================================================================
# 4) Classes + bridging class->skills
# =============================================================================

def insert_classes_5nf(cls_data: list):
    """Insert each class => rpg_entities(type='class') => base_classes."""
    logger.info(f"Inserting {len(cls_data)} classes => base_classes + rpg_entities(type='class').")
    for cls in cls_data:
        entity_data = {
            "id": cls["id"],
            "name": cls["name"],
            "description": cls.get("description", "")
        }
        subtype_data = {
            "hit_die": cls.get("hit_die", None),
            "skill_ranks_per_level": cls.get("base_skill_ranks", None)
        }
        insert_entity_and_subtype("class", entity_data, "base_classes", subtype_data)

def insert_class_skill_relations(data: dict):
    """From top-level 'class_skill_relations' array, bridging for class->skills."""
    relations = data.get("class_skill_relations", [])
    logger.info(f"Inserting bridging for {len(relations)} class-skill sets.")
    for rel in relations:
        class_id = rel["class_id"]
        skill_ids = rel.get("skill_ids", [])
        for sid in skill_ids:
            bridging = {"class_id": class_id, "skill_id": sid}
            execute_insert("class_skill_relations", bridging)

# =============================================================================
# 5) "Subtypes" (class_features, feats, buffs, etc.)
# =============================================================================

def insert_class_features_array(features: list):
    """Insert each => rpg_entities(type='class_feature') => base_class_features."""
    logger.info(f"Inserting {len(features)} class features.")
    for feat in features:
        # Insert into rpg_entities
        fid = insert_into_rpg_entities(
            feat["id"], "class_feature",
            feat["name"], feat.get("description", "")
        )
        if fid and not DRY_RUN:
            sub = feat.get("subtype_data", {})
            sub["id"] = fid
            execute_insert("base_class_features", sub)
            # If we wanted to handle "effects" here, do it.

def insert_ancestral_traits_array(traits: list):
    """ancestral_trait => rpg_entities(type='ancestral_trait') => base_ancestral_traits + effects."""
    logger.info(f"Inserting {len(traits)} ancestral traits.")
    for tr in traits:
        tid = insert_into_rpg_entities(
            tr["id"], "ancestral_trait",
            tr["name"], tr.get("description", "")
        )
        if tid and not DRY_RUN:
            st = tr.get("subtype_data", {})
            sub = {
                "id": tid,
                "ancestry_name": st.get("ancestry_name", ""),
                "is_optional": st.get("is_optional", False)
            }
            execute_insert("base_ancestral_traits", sub)
            # Insert the "effects" for this trait
            insert_effects(tid, tr.get("effects", {}))

def insert_feats_array(feats: list):
    logger.info(f"Inserting {len(feats)} feats => base_feats + rpg_entities(type='feat').")
    for ft in feats:
        fid = insert_into_rpg_entities(
            ft["id"], "feat",
            ft["name"], ft.get("description", "")
        )
        if fid and not DRY_RUN:
            st = ft.get("subtype_data", {})
            sub = {
                "id": fid,
                "feat_label": st.get("feat_label", ft["name"]),
                "feat_type": st.get("feat_type", "")
            }
            execute_insert("base_feats", sub)
            # If feats have "prerequisites", you'd store them in entity_prerequisites, etc.

def insert_buffs_array(buffs: list):
    logger.info(f"Inserting {len(buffs)} buffs => base_buffs + rpg_entities(type='buff').")
    for bf in buffs:
        bid = insert_into_rpg_entities(
            bf["id"], "buff",
            bf["name"], bf.get("description", "")
        )
        if bid and not DRY_RUN:
            st = bf.get("subtype_data", {})
            sub = {
                "id": bid,
                "buff_type_id": st.get("buff_type_id")
            }
            execute_insert("base_buffs", sub)
            # Insert buff's "effects"? If you have them, do so.

def insert_corruptions_array(corrs: list):
    """Insert corruptions and their manifestations into rpg_entities."""
    logger.info(f"Inserting {len(corrs)} corruptions => base_corruptions + rpg_entities(type='corruption').")
    for c in corrs:
        # Insert the main corruption entity
        cid = insert_into_rpg_entities(
            c["id"], "corruption",
            c["name"], c.get("description", "")
        )
        if cid and not DRY_RUN:
            # Insert into base_corruptions
            subdata = {
                "id": cid,
                "corruption_stage": c.get("subtype_data", {}).get("corruption_stage", 0),
                "manifestation_level": c.get("subtype_data", {}).get("manifestation_level", 1)
            }
            execute_insert("base_corruptions", subdata)

            # Insert each manifestation
            for m in c.get("manifestations", []):
                mid = insert_into_rpg_entities(
                    m["id"], "corruption_manifestation",
                    m["name"], m.get("description", "")
                )
                if mid and not DRY_RUN:
                    # Insert into base_corruption_manifestations
                    man_data = {
                        "id": mid,
                        "corruption_id": cid,
                        "min_manifestation_level": m.get("min_manifestation_level", 1),
                        "prerequisite_manifestation": m.get("prerequisite_manifestation")
                    }
                    execute_insert("base_corruption_manifestations", man_data)

                    # If we want to store the effects
                    if "effects" in m:
                        insert_effects(mid, m["effects"])

def insert_discoveries_array(discs: list):
    logger.info(f"Inserting {len(discs)} discoveries => base_discoveries + rpg_entities(type='discovery').")
    for d in discs:
        did = insert_into_rpg_entities(
            d["id"], "discovery",
            d["name"], d.get("description", "")
        )
        if did and not DRY_RUN:
            # e.g. base_discoveries table
            subdata = {"id": did}
            # If there's a "discovery_level" in subtype_data, store it
            # subdata["discovery_level"] = ...
            execute_insert("base_discoveries", subdata)

def insert_wild_talents_array(wtalents: list):
    logger.info(f"Inserting {len(wtalents)} wild talents => base_wild_talents + rpg_entities(type='wild_talent').")
    for w in wtalents:
        wid = insert_into_rpg_entities(
            w["id"], "wild_talent",
            w["name"], w.get("description", "")
        )
        if wid and not DRY_RUN:
            # base_wild_talents
            sub = {"id": wid}
            execute_insert("base_wild_talents", sub)

def insert_equipment_array(equipment: list):
    """Insert equipment items into rpg_entities."""
    if not equipment:
        return
    logger.info(f"Inserting {len(equipment)} equipment items => rpg_entities(type='equipment').")
    for eq in equipment:
        if isinstance(eq, dict):
            entity_data = {
                "id": eq["entity_id"],
                "name": eq["name"],
                "entity_type": "equipment",
                "description": eq.get("description", "")
            }
            inserted = execute_insert("rpg_entities", entity_data)
            
            # If you have equipment-specific properties/effects
            if inserted and not DRY_RUN:
                if "effects" in eq:
                    insert_effects(inserted["id"], eq["effects"])

def insert_consumables_array(cons: list):
    """Insert consumable items into rpg_entities."""
    if not cons:
        return
    logger.info(f"Inserting {len(cons)} consumable items => rpg_entities(type='consumable').")
    for c in cons:
        if isinstance(c, dict):
            entity_data = {
                "id": c["entity_id"],
                "name": c["name"],
                "entity_type": "consumable",
                "description": c.get("description", "")
            }
            inserted = execute_insert("rpg_entities", entity_data)
            
            # If consumables have effects (like potions)
            if inserted and not DRY_RUN and "effects" in c:
                insert_effects(inserted["id"], c["effects"])

def insert_extracts_array(exts: list):
    """Insert extracts into rpg_entities."""
    if not exts:
        return
    logger.info(f"Inserting {len(exts)} extracts => rpg_entities(type='extract').")
    for x in exts:
        entity_data = {
            "id": x["entity_id"],
            "name": x["name"],
            "entity_type": "extract",
            "description": x.get("description", "")
        }
        inserted = execute_insert("rpg_entities", entity_data)
        
        # If extracts have special properties
        if inserted and not DRY_RUN:
            if "effects" in x:
                insert_effects(inserted["id"], x["effects"])

def insert_all_rpg_entities(rpg_data: dict):
    """
    Insert ALL entity types from rpg_data into rpg_entities in one consistent pass.
    This includes classes, features, items, etc. - everything that needs an rpg_entities row.
    """
    logger.info("Starting unified rpg_entities insertion...")

    # Track counts for logging
    counts = {}

    # 1. Classes first (they're often referenced by other entities)
    classes = rpg_data.get("classes", [])
    if classes:
        insert_classes_5nf(classes)
        counts["classes"] = len(classes)

    # 2. Define all entity categories and their handlers
    handlers = {
        "class_features": insert_class_features_array,
        "ancestral_traits": insert_ancestral_traits_array,
        "feats": insert_feats_array,
        "buffs": insert_buffs_array,
        "corruptions": insert_corruptions_array,
        "discoveries": insert_discoveries_array,
        "wild_talents": insert_wild_talents_array,
        "equipment": insert_equipment_array,
        "consumables": insert_consumables_array,
        "extracts": insert_extracts_array
    }

    # 3. Process each category
    for category, handler in handlers.items():
        items = rpg_data.get(category, [])
        if items:
            handler(items)
            counts[category] = len(items)

    # 4. Log summary
    logger.info("Completed rpg_entities insertion with counts:")
    for category, count in counts.items():
        logger.info(f"  - {category}: {count}")

# =============================================================================
# 6) insert_effects: bridging logic for skill_bonuses, weapon_proficiencies, etc.
# =============================================================================

def insert_effects(entity_id: int, effects: dict):
    """
    Insert various effect categories for an entity:
      - skill_bonuses
      - weapon_proficiencies
      - natural_attacks
      - conditional_bonuses
      ... plus anything else your schema demands.
    """
    if not effects:
        return

    # skill_bonuses
    for sb in effects.get("skill_bonuses", []):
        data = {
            "entity_id": entity_id,
            "skill_name": sb["skill_name"],
            "bonus": sb["bonus"]
        }
        execute_insert("skill_bonuses", data)

    # weapon_proficiencies
    for wp in effects.get("weapon_proficiencies", []):
        data = {
            "entity_id": entity_id,
            "weapon_name": wp["weapon_name"]
        }
        execute_insert("weapon_proficiencies", data)

    # natural_attacks
    for na in effects.get("natural_attacks", []):
        data = {
            "entity_id": entity_id,
            "attack_type": na["attack_type"],
            "damage": na["damage"],
            "attack_count": na.get("attack_count", 1)
        }
        execute_insert("natural_attacks", data)

    # conditional_bonuses
    for cb in effects.get("conditional_bonuses", []):
        data = {
            "entity_id": entity_id,
            "bonus_type_id": cb["bonus_type_id"],
            "value": cb["value"],
            "apply_to": cb["apply_to"],
            "condition": cb.get("condition", None)
        }
        execute_insert("conditional_bonuses", data)

# =============================================================================
# 7) Character "Child" Data Handling
# =============================================================================

def insert_character_base_row(char: dict):
    """
    Insert the main row into 'characters'. Return the newly inserted row or None.
    """
    row_data = {
        "id": char["id"],
        "name": char["name"],
        "current_hp": char["current_hp"],
        "max_hp": char["max_hp"],
        "is_offline": char.get("is_offline", False),
        # Possibly user_id if your schema has that
        # "user_id": char["user_id"]
    }
    return execute_insert("characters", row_data)

def insert_character_attributes_via_bridging(char_id: int, attributes: list):
    """
    Batch insert attributes as bridging rows and properties
    """
    if not attributes:
        return
        
    # Prepare bridging rows
    bridging_rows = [{
        "character_id": char_id,
        "entity_id": attr["attribute_id"],
        "is_active": True
    } for attr in attributes]
    
    # Batch insert bridging
    bridging_result = batch_insert("character_rpg_entities", bridging_rows)
    
    if bridging_result and not DRY_RUN:
        # Prepare property rows
        property_rows = []
        for i, attr in enumerate(attributes):
            property_rows.append({
                "character_rpg_entity_id": bridging_result[i]["id"],
                "property_key": "value",
                "property_value": str(attr["value"])
            })
            
        # Batch insert properties
        batch_insert("character_rpg_entity_properties", property_rows)

def insert_character_abp_bonuses(char_id: int, abp_list: list):
    """
    ABP bonuses are entities of type 'abp_bonus' in rpg_entities.
    We'll store them via character_rpg_entities + properties for value and choices.
    """
    for abp in abp_list:
        # Create bridging row
        bridging = {
            "character_id": char_id,
            "entity_id": abp["bonus_type_id"],  # assuming this is the entity_id
            "is_active": True
        }
        bridging_row = execute_insert("character_rpg_entities", bridging)
        
        if bridging_row and not DRY_RUN:
            cre_id = bridging_row["id"]
            
            # Store the value as a property
            value_prop = {
                "character_rpg_entity_id": cre_id,
                "property_key": "value",
                "property_value": str(abp["value"])
            }
            execute_insert("character_rpg_entity_properties", value_prop)
            
            # Store choices as properties
            for ch in abp.get("choices", []):
                choice_prop = {
                    "character_rpg_entity_id": cre_id,
                    "property_key": f"choice_{ch['key']}",
                    "property_value": ch["value"]
                }
                execute_insert("character_rpg_entity_properties", choice_prop)

def insert_character_extracts(char_id: int, extracts: list):
    """
    Extracts are entities of type 'extract' in rpg_entities.
    Store via character_rpg_entities + properties for level/prepared/used.
    """
    for ex in extracts:
        # Create bridging row (assuming extract_name maps to an entity_id)
        bridging = {
            "character_id": char_id,
            "entity_id": ex["entity_id"],  # You'll need to provide this in your YAML
            "is_active": True
        }
        bridging_row = execute_insert("character_rpg_entities", bridging)
        
        if bridging_row and not DRY_RUN:
            cre_id = bridging_row["id"]
            
            # Store properties
            properties = [
                ("level", ex["level"]),
                ("prepared", ex["prepared"]),
                ("used", ex["used"])
            ]
            
            for key, value in properties:
                prop = {
                    "character_rpg_entity_id": cre_id,
                    "property_key": key,
                    "property_value": str(value)
                }
                execute_insert("character_rpg_entity_properties", prop)

def insert_character_favored_class_bonuses(char_id: int, fcb_list: list):
    """
    Favored class bonuses are entities of type 'favored_class_bonus' in rpg_entities.
    Store via character_rpg_entities + properties for level.
    """
    for fcb in fcb_list:
        # Create bridging row
        bridging = {
            "character_id": char_id,
            "entity_id": fcb["choice_id"],  # This should be the entity_id of the FCB choice
            "is_active": True
        }
        bridging_row = execute_insert("character_rpg_entities", bridging)
        
        if bridging_row and not DRY_RUN:
            cre_id = bridging_row["id"]
            
            # Store level as property
            level_prop = {
                "character_rpg_entity_id": cre_id,
                "property_key": "level",
                "property_value": str(fcb["level"])
            }
            execute_insert("character_rpg_entity_properties", level_prop)


def insert_character_skill_ranks(char_id: int, skill_ranks: list):
    """
    skill_ranks is an array of:
      {
        "skill_id": X,
        "source_id": X,
        "ranks_per_level": {
           1:1, 2:1, ...  # level: number_of_ranks_to_create
        }
      }
    Creates one row per rank (if level 1 has 2 ranks, creates 2 rows for level 1)
    """
    for sr in skill_ranks:
        skill_id = sr["skill_id"]
        source_id = sr.get("source_id")
        ranks_map = sr.get("ranks_per_level", {})
        
        # For each level
        for level, num_ranks in ranks_map.items():
            # Create one row per rank at this level
            for _ in range(int(num_ranks)):
                data = {
                    "character_id": char_id,
                    "skill_id": skill_id,
                    "source_id": source_id,
                    "applied_at_level": int(level) if isinstance(level, str) else level
                }
                execute_insert("character_skill_ranks", data)

def insert_character_corruption(char_id: int, corruption_data: dict):
    """
    Store corruptions using the entity system:
    - Bridge corruption entity to character via character_rpg_entities
    - Store stage/blood/etc as properties
    - Bridge each manifestation as a separate entity
    """
    if isinstance(corruption_data, list):
        # If we received a list, process each corruption in the list
        for corruption in corruption_data:
            if isinstance(corruption, dict):
                insert_character_corruption(char_id, corruption)
        return
        
    if not isinstance(corruption_data, dict):
        logger.warning(f"Invalid corruption data format: {corruption_data}")
        return

    try:
        # Create bridging row for the main corruption
        bridging = {
            "character_id": char_id,
            "entity_id": corruption_data.get("entity_id"),  # Use .get() for safety
            "is_active": True
        }

        if not bridging["entity_id"]:
            logger.warning(f"Missing entity_id in corruption data: {corruption_data}")
            return

        bridging_row = execute_insert("character_rpg_entities", bridging)
        
        if bridging_row and not DRY_RUN:
            cre_id = bridging_row["id"]
            
            # Store properties for stage, blood, etc.
            props = [
                ("corruption_type", corruption_data.get("corruption_type", "")),
                ("corruption_stage", corruption_data.get("corruption_stage", 0)),
                ("manifestation_level", corruption_data.get("manifestation_level", 1)),
                ("blood_required", corruption_data.get("blood_required", 0)),
                ("blood_consumed", corruption_data.get("blood_consumed", 0))
            ]
            
            for key, val in props:
                execute_insert("character_rpg_entity_properties", {
                    "character_rpg_entity_id": cre_id,
                    "property_key": key,
                    "property_value": str(val)
                })

            # Bridge each manifestation
            manifestations = corruption_data.get("active_manifestations", [])
            if manifestations and isinstance(manifestations, list):
                for man in manifestations:
                    if isinstance(man, dict) and "entity_id" in man:
                        man_bridging = {
                            "character_id": char_id,
                            "entity_id": man["entity_id"],
                            "is_active": True
                        }
                        man_row = execute_insert("character_rpg_entities", man_bridging)
                        
                        if man_row and not DRY_RUN:
                            # Link manifestation to parent corruption
                            execute_insert("character_rpg_entity_properties", {
                                "character_rpg_entity_id": man_row["id"],
                                "property_key": "parent_corruption_cre_id",
                                "property_value": str(cre_id)
                            })

    except Exception as e:
        logger.error(f"Error processing corruption data: {e}")
        logger.error(f"Corruption data: {corruption_data}")
        raise

def insert_character_equipment_and_consumables(char_id: int, equipment_list: list, consumables_list: list):
    """
    Each item is something like:
      - entity_id: 600
        properties:
          - property_key: "equipped"
            property_value: "true"
          ...
    We can store a bridging row in e.g. "character_rpg_entities" or "character_equipment", 
    then store the properties in "character_rpg_entity_properties".
    """
    # Insert equipment
    for eq in equipment_list:
        eqid = eq["entity_id"]
        bridging = {
            "character_id": char_id,
            "entity_id": eqid,
            "is_active": False  # up to you
        }
        bridging_row = execute_insert("character_rpg_entities", bridging)
        if bridging_row and not DRY_RUN:
            cre_id = bridging_row["id"]
            for prop in eq.get("properties", []):
                p_data = {
                    "character_rpg_entity_id": cre_id,
                    "property_key": prop["property_key"],
                    "property_value": prop["property_value"]
                }
                execute_insert("character_rpg_entity_properties", p_data)

    # Insert consumables
    for co in consumables_list:
        cid = co["entity_id"]
        bridging = {
            "character_id": char_id,
            "entity_id": cid,
            "is_active": False
        }
        bridging_row = execute_insert("character_rpg_entities", bridging)
        if bridging_row and not DRY_RUN:
            cre_id = bridging_row["id"]
            for prop in co.get("properties", []):
                p_data = {
                    "character_rpg_entity_id": cre_id,
                    "property_key": prop["property_key"],
                    "property_value": prop["property_value"]
                }
                execute_insert("character_rpg_entity_properties", p_data)

def insert_character_entity_selections(char_id: int, entity_selections: dict):
    """
    entity_selections might look like:
      {
        "classes": [...],
        "ancestries": [...],
        "equipment": [...],
        "consumables": [...],
        ...
      }
    We'll make bridging rows in "character_rpg_entities" or whichever table 
    for each chosen entity, plus storing properties, or selected_level, etc.
    """
    # classes
    if "classes" in entity_selections:
        for c in entity_selections["classes"]:
            bridging = {
                "character_id": char_id,
                "entity_id": c["entity_id"],
                "is_active": True
            }
            row = execute_insert("character_rpg_entities", bridging)
            if row and not DRY_RUN:
                cre_id = row["id"]
                # Insert properties
                for prop in c.get("properties", []):
                    p_data = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": prop["property_key"],
                        "property_value": prop["property_value"]
                    }
                    execute_insert("character_rpg_entity_properties", p_data)

    # ancestries
    if "ancestries" in entity_selections:
        for anc in entity_selections["ancestries"]:
            bridging = {
                "character_id": char_id,
                "entity_id": anc["entity_id"],
                "is_active": True
            }
            execute_insert("character_rpg_entities", bridging)

    # class_features
    if "class_features" in entity_selections:
        for cf in entity_selections["class_features"]:
            bridging = {
                "character_id": char_id,
                "entity_id": cf["entity_id"],
                "is_active": True
            }
            row = execute_insert("character_rpg_entities", bridging)
            if row and not DRY_RUN:
                cre_id = row["id"]
                # "selected_level" can be stored in a property, or a dedicated column
                # We'll do a property approach for demonstration:
                sl_data = {
                    "character_rpg_entity_id": cre_id,
                    "property_key": "selected_level",
                    "property_value": str(cf["selected_level"])
                }
                execute_insert("character_rpg_entity_properties", sl_data)

                # If it has properties array:
                for prop in cf.get("properties", []):
                    p_data = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": prop["property_key"],
                        "property_value": prop["property_value"]
                    }
                    execute_insert("character_rpg_entity_properties", p_data)

    # discoveries
    if "discoveries" in entity_selections:
        for disc in entity_selections["discoveries"]:
            bridging = {
                "character_id": char_id,
                "entity_id": disc["entity_id"],
                "is_active": True
            }
            row = execute_insert("character_rpg_entities", bridging)
            if row and not DRY_RUN:
                cre_id = row["id"]
                # store name? selected_level? 
                # if "name" is used, we might store it in a property
                if "name" in disc:
                    ndat = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": "display_name",
                        "property_value": disc["name"]
                    }
                    execute_insert("character_rpg_entity_properties", ndat)
                if "selected_level" in disc:
                    sldat = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": "selected_level",
                        "property_value": str(disc["selected_level"])
                    }
                    execute_insert("character_rpg_entity_properties", sldat)

    # wild_talents
    if "wild_talents" in entity_selections:
        for wt in entity_selections["wild_talents"]:
            bridging = {
                "character_id": char_id,
                "entity_id": wt["entity_id"],
                "is_active": True
            }
            row = execute_insert("character_rpg_entities", bridging)
            if row and not DRY_RUN:
                cre_id = row["id"]
                if "name" in wt:
                    nm = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": "display_name",
                        "property_value": wt["name"]
                    }
                    execute_insert("character_rpg_entity_properties", nm)
                if "selected_level" in wt:
                    sl = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": "selected_level",
                        "property_value": str(wt["selected_level"])
                    }
                    execute_insert("character_rpg_entity_properties", sl)

    # feats
    if "feats" in entity_selections:
        for ft in entity_selections["feats"]:
            bridging = {
                "character_id": char_id,
                "entity_id": ft["entity_id"],
                "is_active": True
            }
            row = execute_insert("character_rpg_entities", bridging)
            if row and not DRY_RUN:
                cre_id = row["id"]
                # store selected_level
                if "selected_level" in ft:
                    sldat = {
                        "character_rpg_entity_id": cre_id,
                        "property_key": "selected_level",
                        "property_value": str(ft["selected_level"])
                    }
                    execute_insert("character_rpg_entity_properties", sldat)
    if "corruptions" in entity_selections:
        insert_character_corruption(char_id, entity_selections["corruptions"])

    # equipment & consumables
    equip = entity_selections.get("equipment", [])
    consu = entity_selections.get("consumables", [])
    insert_character_equipment_and_consumables(char_id, equip, consu)

# =============================================================================
# Insert Characters (full)
# =============================================================================

def insert_characters(data: dict):
    """
    For each character, do:
     1) Insert 'characters' row
     2) Insert character_attributes
     3) Insert entity_selections bridging (class, ancestry, feats, etc.)
     4) Insert abp_bonuses
     5) Insert extracts
     6) Insert favored_class_bonuses
     7) Insert skill_ranks
     8) Insert corruption
    """
    chars = data.get("characters", [])
    logger.info(f"Inserting {len(chars)} characters.")
    for char in chars:
        try:
            # Step 1: insert character base row
            c_row = insert_character_base_row(char)
            if not c_row or DRY_RUN:
                continue
            char_id = c_row["id"]

            # Step 2: insert attributes (using the new bridging approach)
            attributes = char.get("character_attributes", [])
            insert_character_attributes_via_bridging(char_id, attributes)

            # Step 3: entity selections
            entity_sel = char.get("entity_selections", {})
            insert_character_entity_selections(char_id, entity_sel)

            # Step 4: abp_bonuses
            abp_list = char.get("abp_bonuses", [])
            insert_character_abp_bonuses(char_id, abp_list)

            # Step 5: extracts
            extracts = char.get("extracts", [])
            insert_character_extracts(char_id, extracts)

            # Step 6: favored_class_bonuses
            fcb_list = char.get("favored_class_bonuses", [])
            insert_character_favored_class_bonuses(char_id, fcb_list)

            # Step 7: skill_ranks
            skill_ranks = char.get("skill_ranks", [])
            insert_character_skill_ranks(char_id, skill_ranks)

        except Exception as e:
            logger.error(f"Error inserting character {char.get('name', '')}: {e}")
            continue

# =============================================================================
# Main
# =============================================================================

def main():
    logger.info("Starting 'everything is an entity' data import...")
    yaml_file = "data.yaml"
    if len(sys.argv) > 1 and sys.argv[1].endswith(".yaml"):
        yaml_file = sys.argv[1]

    data = load_yaml(yaml_file)
    rpg_data = data.get("rpg_entities", {})

    try:
        # 1) Insert reference tables
        insert_reference_tables(data)

        # 2) Insert base tables (skills, ancestries)
        insert_base_tables_5nf(data)

        # 3) Insert ALL rpg_entities in one consistent pass
        insert_all_rpg_entities(rpg_data)

        # 4) Insert bridging: class->skills
        insert_class_skill_relations(data)

        # 5) Insert characters + bridging child data
        insert_characters(data)

        logger.info("Data import COMPLETED successfully!")
    except Exception as e:
        logger.error(f"Exception in main import: {e}")
        raise

if __name__ == "__main__":
    main()
