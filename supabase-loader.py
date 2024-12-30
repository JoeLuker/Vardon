#!/usr/bin/env python3
"""
Updated Python script to load Pathfinder 1E game data from YAML into Supabase/Postgres.
Handles the reference tables, base tables, and RPG entities structure.
"""

import os
from dotenv import load_dotenv
import yaml
from supabase import create_client, Client
import logging
import sys
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

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or "https://<YOUR_PROJECT>.supabase.co"
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or "<YOUR_ANON_KEY>"

DRY_RUN = "--dry-run" in sys.argv

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# =============================================================================
# Utilities
# =============================================================================
def execute_insert(table_name: str, data: dict) -> Optional[dict]:
    """Execute an insert operation with dry run support."""
    if DRY_RUN:
        logger.info(f"[DRY RUN] Insert into {table_name}: {data}")
        return None
    try:
        response = supabase.table(table_name).insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error inserting into {table_name}: {e}")
        raise

def load_yaml(file_path: str) -> dict:
    """Load YAML data from file."""
    logger.info(f"Loading YAML data from {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data
    except Exception as e:
        logger.error(f"Failed to load YAML file: {e}")
        raise

# =============================================================================
# Reference Tables
# =============================================================================
def insert_reference_tables(data: dict):
    """Insert all reference table data."""
    ref_tables = data.get("reference_tables", {})
    
    table_mappings = {
        "bonus_types": "bonus_types",
        "skill_rank_sources": "skill_rank_sources", 
        "buff_types": "buff_types",
        "abp_bonus_types": "abp_bonus_types",
        "favored_class_choices": "favored_class_choices"
    }
    
    for yaml_key, table_name in table_mappings.items():
        items = ref_tables.get(yaml_key, [])
        if not isinstance(items, list):
            continue
            
        logger.info(f"Inserting {len(items)} rows into {table_name}")
        for item in items:
            if isinstance(item, dict):
                execute_insert(table_name, item)
# =============================================================================
# Base Tables
# =============================================================================
def insert_classes(data: dict):
    """Insert base classes first."""
    rpg_data = data.get("rpg_entities", {})
    classes = rpg_data.get("classes", [])
    
    logger.info(f"Inserting {len(classes)} base classes")
    for class_data in classes:
        class_insert = {
            "name": class_data["name"],
            "description": class_data.get("description", "")
        }
        execute_insert("base_classes", class_insert)

def insert_base_tables(data: dict):
    """Insert base table data (skills, ancestries, etc.)."""
    base_data = data.get("base_tables", {})

    # Insert base skills
    skills = base_data.get("skills", [])
    for skill in skills:
        execute_insert("base_skills", {
            "name": skill["name"],
            "ability": skill["ability"],
            "trained_only": skill.get("trained_only", False),
            "armor_check_penalty": skill.get("armor_check_penalty", False)
        })

    # Insert ancestries
    ancestries = base_data.get("ancestries", [])
    for ancestry in ancestries:
        ancestry_data = {
            "name": ancestry["name"],
            "size": ancestry.get("size", "medium"),
            "base_speed": ancestry.get("base_speed", 30),
            "description": ancestry.get("description", "")
        }
        res = execute_insert("base_ancestries", ancestry_data)
        
        if res and not DRY_RUN:
            ancestry_id = res["id"]
            # Insert ability modifiers
            for mod in ancestry.get("ability_modifiers", []):
                mod_data = {
                    "ancestry_id": ancestry_id,
                    "ability_name": mod["ability"],
                    "modifier": mod["modifier"]
                }
                execute_insert("ancestry_ability_modifiers", mod_data)



# =============================================================================
# RPG Entities
# =============================================================================
def insert_rpg_entity(data: dict) -> Optional[int]:
    """Insert an RPG entity and return its ID."""
    entity_data = {
        "entity_type": data["entity_type"],
        "name": data["name"],
        "description": data.get("description", "")
    }
    res = execute_insert("rpg_entities", entity_data)
    return res["id"] if res else None

def insert_effects(entity_id: int, effects: Dict[str, List[dict]]):
    """Insert various effect types for an entity."""
    if not effects:
        return

    # Handle skill bonuses
    for bonus in effects.get("skill_bonuses", []):
        data = {
            "entity_id": entity_id,
            "skill_name": bonus["skill_name"],
            "bonus": bonus["bonus"]
        }
        execute_insert("skill_bonuses", data)

    # Handle weapon proficiencies
    for prof in effects.get("weapon_proficiencies", []):
        data = {
            "entity_id": entity_id,
            "weapon_name": prof["weapon_name"]
        }
        execute_insert("weapon_proficiencies", data)

    # Handle natural attacks
    for attack in effects.get("natural_attacks", []):
        data = {
            "entity_id": entity_id,
            "attack_type": attack["attack_type"],
            "damage": attack["damage"],
            "attack_count": attack.get("attack_count", 1)
        }
        execute_insert("natural_attacks", data)

    # Handle conditional bonuses
    for bonus in effects.get("conditional_bonuses", []):
        data = {
            "entity_id": entity_id,
            "bonus_type_id": bonus["bonus_type_id"],
            "value": bonus["value"],
            "apply_to": bonus["apply_to"],
            "condition": bonus.get("condition")
        }
        execute_insert("conditional_bonuses", data)

def insert_class_features(data: dict):
    """Insert class features after classes exist."""
    rpg_data = data.get("rpg_entities", {})
    
    # Get class mapping first to convert class_id to name if needed
    class_id_map = {}
    classes_result = supabase.table("base_classes").select("id, name").execute()
    for class_data in classes_result.data:
        class_id_map[class_data["id"]] = class_data["name"]
        class_id_map[class_data["name"]] = class_data["id"]

    # Now insert features
    for feature in rpg_data.get("class_features", []):
        entity_id = insert_rpg_entity({
            "entity_type": "class_feature",
            "name": feature["name"],
            "description": feature.get("description", "")
        })
        
        if entity_id and not DRY_RUN:
            # Handle both id and name cases for backwards compatibility
            class_id = feature["subtype_data"]["class_id"]
            if isinstance(class_id, str):
                class_id = class_id_map.get(class_id)
            if not class_id or class_id not in class_id_map:
                logger.error(f"Could not find class_id for feature {feature['name']}")
                continue

            feature_data = {
                "id": entity_id,
                "class_id": class_id,
                "feature_level": feature["subtype_data"]["feature_level"]
            }
            execute_insert("base_class_features", feature_data)
            
            # Insert effects
            insert_effects(entity_id, feature.get("effects", {}))

def insert_all_rpg_entities(data: dict):
    """Insert all RPG entities and their related data."""
    insert_class_features(data)
    
    rpg_data = data.get("rpg_entities", {})
    
    # Insert ancestral traits
    for trait in rpg_data.get("ancestral_traits", []):
        entity_id = insert_rpg_entity({
            "entity_type": "ancestral_trait",
            "name": trait["name"],
            "description": trait.get("description", "")
        })
        
        if entity_id and not DRY_RUN:
            trait_data = {
                "id": entity_id,
                "ancestry_name": trait["subtype_data"]["ancestry_name"],
                "is_optional": trait["subtype_data"]["is_optional"]
            }
            execute_insert("base_ancestral_traits", trait_data)
            insert_effects(entity_id, trait.get("effects", {}))

    # Insert traits, feats, buffs in a similar pattern...
    # [Additional entity type handling here]

# =============================================================================
# Characters
# =============================================================================
def insert_characters(data: dict):
    """Insert characters and all related data."""
    characters = data.get("characters", [])
    
    for char in characters:
        # Insert base character data
        char_data = {
            "name": char["name"],
            "class_name": char.get("class_name"),
            "ancestry_name": char.get("ancestry_name"),
            "level": char["level"],
            "current_hp": char["current_hp"],
            "max_hp": char["max_hp"],
            "archetype_name": char.get("archetype_name"),
            "is_offline": char.get("is_offline", False)
        }
        char_res = execute_insert("characters", char_data)
        
        if not char_res or DRY_RUN:
            continue
            
        char_id = char_res["id"]
        
        # Insert attributes
        if "attributes" in char:
            attr_data = {
                "character_id": char_id,
                **char["attributes"]  # Spread operator for all attributes
            }
            execute_insert("character_attributes", attr_data)
        
        # Insert equipment
        for equip in char.get("equipment", []):
            eq_data = {
                "character_id": char_id,
                "name": equip["name"],
                "type": equip["type"],
                "equipped": equip.get("equipped", False)
            }
            eq_res = execute_insert("character_equipment", eq_data)
            
            if eq_res and not DRY_RUN:
                # Insert equipment properties
                for prop in equip.get("properties", []):
                    prop_data = {
                        "equipment_id": eq_res["id"],
                        "property_key": prop["key"],
                        "property_value": prop["value"]
                    }
                    execute_insert("character_equipment_properties", prop_data)
        
        # Insert consumables
        for cons in char.get("consumables", []):
            cons_data = {
                "character_id": char_id,
                "consumable_type": cons["consumable_type"],
                "quantity": cons["quantity"]
            }
            execute_insert("character_consumables", cons_data)
        
        # Insert entity selections (class features, etc.)
        for selection in char.get("entity_selections", []):
            selection_data = {
                "character_id": char_id,
                "entity_id": selection["entity_id"],
                "selected_level": selection.get("selected_level", 1),
                "is_active": selection.get("is_active", True)
            }
            execute_insert("character_rpg_entities", selection_data)

# =============================================================================
# Main Execution
# =============================================================================
def main():
    logger.info("Starting data import process...")
    
    yaml_file = "data.yaml"
    if len(sys.argv) > 1 and sys.argv[1].endswith(".yaml"):
        yaml_file = sys.argv[1]

    data = load_yaml(yaml_file)

    try:
        # Modified loading sequence to handle dependencies
        insert_reference_tables(data)
        insert_base_tables(data)
        insert_classes(data)  # Insert classes before features
        insert_all_rpg_entities(data)
        
        logger.info("Data import completed successfully.")
    except Exception as e:
        logger.error(f"Error during import: {e}")
        raise

if __name__ == "__main__":
    main()
