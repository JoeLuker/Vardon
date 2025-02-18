"""
Game Rules API Generator

Generates TypeScript code for accessing game rules data with proper relationships and caching.
"""

import psycopg2
from typing import List, Dict, Tuple, Any
import os
from dotenv import load_dotenv
from textwrap import dedent, indent

def get_game_tables(dsn: str) -> Tuple[List[str], Dict[str, List[Tuple[str, str]]]]:
    """Get all game rule tables and their relationships"""
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            # Get all tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """)
            tables = [row[0] for row in cur.fetchall()]

            # Get foreign key relationships
            cur.execute("""
                SELECT
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public';
            """)
            
            relationships = {}
            for table, column, foreign_table in cur.fetchall():
                if table not in relationships:
                    relationships[table] = []
                relationships[table].append((column, foreign_table))

            return tables, relationships

def to_ts_name(db_name: str, pascal: bool = False) -> str:
    """Convert database name to TypeScript name"""
    words = db_name.split('_')
    if pascal:
        return ''.join(w.title() for w in words)
    return words[0] + ''.join(w.title() for w in words[1:])

def generate_types(tables: List[str]) -> str:
    """Generate type definitions for all tables"""
    return f"""// Base types for database tables
type DbTables = Database['public']['Tables'];

// Generic types for all game rules
export type GameRule<T extends keyof DbTables> = DbTables[T]['Row'];
export type GameRuleInsert<T extends keyof DbTables> = DbTables[T]['Insert'];
export type GameRuleUpdate<T extends keyof DbTables> = Omit<DbTables[T]['Update'], 'id'> & {{ id: number }};

// Specific rule types
{chr(10).join(f'''export type {to_ts_name(table, True)} = GameRule<"{table}">;
export type {to_ts_name(table, True)}Insert = GameRuleInsert<"{table}">;
export type {to_ts_name(table, True)}Update = GameRuleUpdate<"{table}">; ''' for table in sorted(tables))}"""

def get_related_tables(table: str, relationships: Dict[str, List[Tuple[str, str]]], seen: set = None) -> List[str]:
    """Recursively get all related tables"""
    if seen is None:
        seen = set()
    if table in seen:
        return []
    
    seen.add(table)
    related = []
    
    if table in relationships:
        for _, foreign_table in relationships[table]:
            if foreign_table not in seen:
                related.append(foreign_table)
                related.extend(get_related_tables(foreign_table, relationships, seen))
    
    return related

def get_table_relationships(dsn: str) -> Dict[str, Dict[str, Any]]:
    """Get complete table relationship structure including primary/foreign keys and references"""
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            # Get primary keys
            cur.execute("""
                SELECT 
                    tc.table_name, 
                    kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public';
            """)
            primary_keys = {row[0]: row[1] for row in cur.fetchall()}

            # Get foreign key relationships with referenced columns
            cur.execute("""
                SELECT
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public';
            """)
            
            relationships = {}
            for table, column, foreign_table, foreign_column in cur.fetchall():
                if table not in relationships:
                    relationships[table] = {
                        'primary_key': primary_keys.get(table),
                        'foreign_keys': [],
                        'referenced_by': []
                    }
                if foreign_table not in relationships:
                    relationships[foreign_table] = {
                        'primary_key': primary_keys.get(foreign_table),
                        'foreign_keys': [],
                        'referenced_by': []
                    }
                
                # Add foreign key relationship
                relationships[table]['foreign_keys'].append({
                    'column': column,
                    'references_table': foreign_table,
                    'references_column': foreign_column
                })
                
                # Add reverse relationship
                relationships[foreign_table]['referenced_by'].append({
                    'table': table,
                    'column': column
                })

            return relationships

def generate_select_query(table: str, relationships: Dict[str, Dict[str, Any]], seen: set = None, depth: int = 0) -> str:
    """Generate a nested select query based on table relationships"""
    if seen is None:
        seen = set()
    
    # If we've already seen this table, skip it
    if table in seen:
        return ""
    
    # Mark this table as seen
    seen.add(table)
    
    # Start with all columns from current table
    parts = ["*"]
    
    # Find all mapping tables that reference this table
    mapping_tables = []
    for table_name, info in relationships.items():
        if table_name.startswith(f"{table}_") or table_name.startswith("game_character_"):
            for fk in info.get('foreign_keys', []):
                if fk['references_table'] == table:
                    mapping_tables.append(table_name)
                    break
    
    # Add mapping table relationships
    for mapping_table in mapping_tables:
        if mapping_table not in seen:
            mapping_info = relationships[mapping_table]
            
            # Find the other tables this mapping table references
            related_tables = []
            for fk in mapping_info.get('foreign_keys', []):
                if fk['references_table'] != table and fk['references_table'] not in seen:
                    related_tables.append(fk['references_table'])
            
            # Add the mapping table with its related tables
            if related_tables:  # Only add mapping table if it has unseen related tables
                nested_parts = ["*"]
                for related_table in related_tables:
                    nested_query = generate_select_query(related_table, relationships, seen, depth + 1)
                    if nested_query:
                        nested_parts.append(f"{related_table}({nested_query})")
                
                if len(nested_parts) > 1:  # Only add if we have more than just "*"
                    parts.append(f"{mapping_table}({','.join(nested_parts)})")
    
    return ",\n".join(parts)

def format_nested_query(query: str) -> str:
    # Split on commas and clean up whitespace
    parts = [p.strip() for p in query.split(',')]
    
    # Track nesting level
    level = 0
    formatted = []
    
    for part in parts:
        # Count opening and closing parentheses
        opens = part.count('(')
        closes = part.count(')')
        
        # Add indentation based on current level
        indent = '    ' * level
        formatted.append(indent + part)
        
        # Adjust nesting level
        level += opens - closes
    
    return ',\n'.join(formatted)

def generate_game_rules_api(dsn: str) -> str:
    relationships = get_table_relationships(dsn)
    select_query = generate_select_query('game_character', relationships)
    formatted_select = format_nested_query(select_query)
    
    return dedent(f"""
        import type {{ GameRulesTypes }} from './gameRules.types';
        import type {{ SupabaseClient }} from '@supabase/supabase-js';
        
        export class GameRulesAPI {{
            constructor(private supabase: SupabaseClient) {{}}

            async getCompleteCharacterData(characterId: number) {{
                const {{ data, error }} = await this.supabase
                    .from('game_character')
                    .select(`
                        {formatted_select}
                    `)
                    .eq('id', characterId)
                    .single();

                if (error) throw error;
                return data;
            }}
        }}
    """).strip()

def generate_game_rules_code(dsn: str) -> None:
    """Generate game rules TypeScript code"""
    api_content = generate_game_rules_api(dsn)
    
    with open('src/lib/db/gameRules.api.ts', 'w') as f:
        f.write(api_content)
    
    print("Generated game rules API!")

if __name__ == "__main__":
    load_dotenv()
    
    DSN = f"dbname={os.getenv('dbname')} user={os.getenv('user')} \
           password={os.getenv('password')} host={os.getenv('host')} \
           port={os.getenv('port')} sslmode=disable"
    
    try:
        generate_game_rules_code(DSN)
    except Exception as e:
        print(f"Failed to generate game rules code: {str(e)}")
        exit(1)