"""
Game Rules API Generator

Generates TypeScript code for accessing game rules data with proper relationships and caching.
"""

import psycopg2
from typing import List, Dict, Tuple
import os
from dotenv import load_dotenv
from datetime import datetime

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
    """Generate TypeScript types for all game rules"""
    return f"""

type DbTables = Database['public']['Tables'];

export type GameRule<T extends keyof DbTables> = DbTables[T]['Row'];
export type GameRuleInsert<T extends keyof DbTables> = DbTables[T]['Insert'];
export type GameRuleUpdate<T extends keyof DbTables> = DbTables[T]['Update'] & {{ id?: number }};

// Specific rule types
{chr(10).join(f'''export type {to_ts_name(table, True)} = GameRule<"{table}">;
export type {to_ts_name(table, True)}Insert = GameRuleInsert<"{table}">;
export type {to_ts_name(table, True)}Update = GameRuleUpdate<"{table}">; ''' for table in tables)}
"""

def generate_relationships_interface(relationships: Dict[str, List[Tuple[str, str]]]) -> str:
    """Generate TypeScript interface for relationship caching"""
    # Create a dict of target_table -> set of source columns
    relationship_map = {}
    
    for table, rels in relationships.items():
        for column, foreign_table in rels:
            if foreign_table not in relationship_map:
                relationship_map[foreign_table] = set()
            relationship_map[foreign_table].add(column)
    
    cache_types = []
    for foreign_table, columns in sorted(relationship_map.items()):
        for column in sorted(columns):
            cache_name = f"{to_ts_name(foreign_table)}By{to_ts_name(column, True)}"
            foreign_type = to_ts_name(foreign_table, True)
            cache_types.append(f"    {cache_name}: Record<number, {foreign_type}[]>;")
    
    return """
export interface GameRuleRelationships {
""" + "\n".join(cache_types) + "\n}"

def generate_relationship_functions(relationships: Dict[str, List[Tuple[str, str]]]) -> str:
    """Generate TypeScript functions for accessing relationships with better loading patterns"""
    functions = []
    
    for table, rels in relationships.items():
        for column, foreign_table in rels:
            cache_name = f"{to_ts_name(foreign_table)}By{to_ts_name(column, True)}"
            function_name = f"get{to_ts_name(foreign_table, True)}For{to_ts_name(table, True)}"
            foreign_type = to_ts_name(foreign_table, True)
            
            functions.append(f"""
    async {function_name}(ids: number[]): Promise<Record<number, {foreign_type}[]>> {{
        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.{cache_name}[id]);
        
        if (uncachedIds.length > 0) {{
            // Load uncached relationships in bulk
            const {{ data, error }} = await (this.supabase
                .from('{table}')
                .select(`
                    id,
                    {column},
                    {foreign_table}_data:{foreign_table}:*
                `)
                .in('{column}', uncachedIds) as unknown) as {{ 
                    data: Array<{{ 
                        {column}: number; 
                        {foreign_table}_data: {foreign_type} 
                    }}>; 
                    error: any; 
                }};
            
            if (error) throw error;
            
            // Group results by {column}
            const results: Record<number, {foreign_type}[]> = {{}};
            data?.forEach(row => {{
                const id = row['{column}'];
                if (!results[id]) results[id] = [];
                if (row['{foreign_table}_data']) results[id].push(row['{foreign_table}_data']);
            }});
            
            // Update cache
            Object.keys(results).forEach(idStr => {{
                const id = Number(idStr);
                this.relationships.{cache_name}[id] = results[id];
            }});
        }}
        
        // Return requested relationships from cache
        const result: Record<number, {foreign_type}[]> = {{}};
        ids.forEach(id => {{
            result[id] = this.relationships.{cache_name}[id] || [];
        }});
        return result;
    }}""")
    
    return "\n".join(functions)

def generate_table_operations_class() -> str:
    """Generate the base TableOperations class with bulk operations"""
    return """class TableOperations<T extends { id: number }, TInsert, TUpdate> {
    private channel: RealtimeChannel | null = null;

    constructor(
        private supabase: SupabaseClient,
        private tableName: string,
        private cache: Map<number, T> = new Map()
    ) {}

    async getAll(): Promise<T[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .order('id');
        if (error) throw error;
        
        // Update cache
        data?.forEach(item => this.cache.set(item.id, item));
        return data;
    }

    async getById(id: number): Promise<T | null> {
        // Check cache first
        if (this.cache.has(id)) {
            return this.cache.get(id) || null;
        }

        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        
        // Update cache
        if (data) this.cache.set(data.id, data);
        return data;
    }

    async getByIds(ids: number[]): Promise<T[]> {
        if (!ids.length) return [];
        
        // Check which ids we need to fetch
        const uncachedIds = ids.filter(id => !this.cache.has(id));
        
        if (uncachedIds.length > 0) {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .in('id', uncachedIds);
            if (error) throw error;
            
            // Update cache with new data
            data?.forEach(item => this.cache.set(item.id, item));
        }
        
        // Return all requested items from cache
        return ids.map(id => this.cache.get(id)).filter((item): item is T => item != null);
    }

    async create(newItem: TInsert): Promise<T | null> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert(newItem)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async update(changes: TUpdate & { id?: number }): Promise<T | null> {
        const { id, ...rest } = changes;
        if (!id) throw new Error(`update${this.tableName}: missing "id" field`);
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(rest)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    watch(
        onChange: (type: 'insert' | 'update' | 'delete', row: T, oldRow?: T) => void
    ): () => void {
        if (this.channel) {
            this.stopWatch();
        }

        this.channel = this.supabase
            .channel(`${this.tableName}_changes`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' && payload.new) {
                        onChange('insert', payload.new as T);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        onChange('update', payload.new as T, payload.old as T);
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        onChange('delete', payload.old as T);
                    }
                }
            )
            .subscribe();

        return () => this.stopWatch();
    }

    stopWatch(): void {
        if (this.channel) {
            try {
                this.supabase.removeChannel(this.channel);
            } catch (err) {
                console.error(`Error removing channel for ${this.tableName}:`, err);
            } finally {
                this.channel = null;
            }
        }
    }
}"""

def generate_crud_functions(tables: List[str]) -> str:
    """Generate CRUD operations for each table"""
    # Generate table operations instances
    ops_declarations = []
    ops_initializations = []
    method_declarations = []
    watch_functions = []

    for table in tables:
        type_name = to_ts_name(table, True)
        ops_var = f"{table}Ops"
        
        ops_declarations.append(
            f"    private {ops_var}: TableOperations<{type_name}, {type_name}Insert, {type_name}Update>;")
        
        ops_initializations.append(
            f"        this.{ops_var} = new TableOperations(supabase, '{table}');")
        
        # Generate wrapper methods
        method_declarations.extend([
            f"""    // {type_name} operations
    getAll{type_name} = () => this.{ops_var}.getAll();
    get{type_name}ById = (id: number) => this.{ops_var}.getById(id);
    create{type_name} = (newItem: {type_name}Insert) => this.{ops_var}.create(newItem);
    update{type_name} = (changes: {type_name}Update) => this.{ops_var}.update(changes);
    delete{type_name} = (id: number) => this.{ops_var}.delete(id);
    get{type_name}sByIds = (ids: number[]) => this.{ops_var}.getByIds(ids);
    watch{type_name} = (onChange: (type: 'insert' | 'update' | 'delete', row: {type_name}, oldRow?: {type_name}) => void) => {{
        const unsubscribe = this.{ops_var}.watch(onChange);
        this.watchers.push(unsubscribe);
        return unsubscribe;
    }};
    stopWatch{type_name} = () => this.{ops_var}.stopWatch();"""])

    return f"""    // Watcher management
    private watchers: Array<() => void> = [];
    
    stopAllWatchers() {{
        this.watchers.forEach(unsubscribe => unsubscribe());
        this.watchers = [];
    }}

    // Table operations instances
{chr(10).join(ops_declarations)}

    constructor(private supabase: SupabaseClient) {{
{chr(10).join(ops_initializations)}
    }}

    // Table operations methods
{chr(10).join(method_declarations)}"""

def generate_character_grain_function(relationships: Dict[str, List[Tuple[str, str]]]) -> Tuple[str, str]:
    """Generate a function to fetch complete character data with all relationships"""
    # Find all tables that reference 'game_character'
    character_relations = []
    for table, rels in relationships.items():
        for column, foreign_table in rels:
            if foreign_table == 'game_character':
                character_relations.append({
                    'table': table,
                    'column': column,
                    'nested': [
                        (col, ftable) for col, ftable in relationships.get(table, [])
                        if ftable != 'game_character'
                    ]
                })
    
    # Build the select query dynamically
    select_parts = ['*']
    type_parts = []
    
    # Add type definitions and select parts for each relation
    for relation in character_relations:
        table = relation['table']
        type_name = to_ts_name(table, True)
        nested_type = ''
        
        if relation['nested']:
            target_table = relation['nested'][0][1]
            target_type = to_ts_name(target_table, True)
            nested_type = f" & {{ {target_table}: {target_type} }}"
            select_parts.append(f"{table}:{table}(*, {target_table}(*))")
        else:
            select_parts.append(f"{table}:{table}(*)")
        
        type_parts.append(f"    {table}: Array<{type_name}{nested_type}>;")
    
    type_definition = f"""export interface CompleteCharacter extends GameCharacter {{
{chr(10).join(type_parts)}
}}"""
    
    select_query = ',\n                '.join(select_parts)
    
    # Return the type definition and methods separately
    methods = f"""
    async getCompleteCharacterData(characterId: number): Promise<CompleteCharacter | null> {{
        const {{ data, error }} = await this.supabase
            .from('game_character')
            .select(`
                {select_query}
            `)
            .eq('id', characterId)
            .single();

        if (error) throw error;
        return data;
    }}

    async getMultipleCompleteCharacterData(characterIds: number[]): Promise<CompleteCharacter[]> {{
        if (!characterIds.length) return [];
        
        const {{ data, error }} = await this.supabase
            .from('game_character')
            .select(`
                {select_query}
            `)
            .in('id', characterIds);

        if (error) throw error;
        return data || [];
    }}"""
    
    return type_definition, methods

def generate_game_rules_api(tables: List[str], relationships: Dict[str, List[Tuple[str, str]]]) -> str:
    """Generate the complete game rules API"""
    # Get character grain types and methods separately
    character_types, character_methods = generate_character_grain_function(relationships)
    
    # Create a set of unique relationship cache names
    unique_relationships = {
        f'{to_ts_name(foreign_table)}By{to_ts_name(column, True)}'
        for table, rels in relationships.items()
        for column, foreign_table in rels
    }
    
    relationship_init = ',\n'.join(f'        {rel}: {{}}' for rel in sorted(unique_relationships))
    
    return f"""
/**
 * Game Rules API
 * Generated {datetime.now().isoformat()}
 * 
 * Provides type-safe access to game rules with relationship handling, CRUD operations, and realtime updates.
 */

import {{ RealtimeChannel }} from '@supabase/supabase-js';
import type {{ SupabaseClient }} from '@supabase/supabase-js';

// Base types for all game rules
import type {{ Database }} from '$lib/domain/types/supabase';

{generate_types(tables)}

{character_types}

{generate_relationships_interface(relationships)}

{generate_table_operations_class()}

export class GameRulesAPI {{
    private relationships: GameRuleRelationships = {{
        {relationship_init}
    }};

{generate_crud_functions(tables)}

    // Relationship functions
{generate_relationship_functions(relationships)}

    // Character grain functions{character_methods}
}}
"""

def generate_game_rules_code(dsn: str) -> None:
    """Generate all game rules TypeScript code"""
    # Get schema info
    tables, relationships = get_game_tables(dsn)
    
    # Create output directory
    # os.makedirs('src/gameRules', exist_ok=True)
    
    # Generate API file
    api_content = generate_game_rules_api(tables, relationships)
    
    with open('src/lib/db/gameRules.api.ts', 'w') as f:
        f.write(api_content)
    
    print(f"Generated game rules API with {len(tables)} tables and {sum(len(rels) for rels in relationships.values())} relationships!")

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