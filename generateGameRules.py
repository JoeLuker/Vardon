"""
Game Rules API Generator

Generates TypeScript code for accessing game rules data with proper relationships and caching.
"""

import psycopg2
from typing import List, Dict, Tuple, Any
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

def get_character_related_tables(dsn: str) -> List[Dict[str, Any]]:
    """Get all tables that relate to game_character with their join paths"""
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            # Get all tables that start with game_character_
            cur.execute("""
                WITH RECURSIVE related_tables AS (
                    -- Base case: direct relationships to game_character
                    SELECT 
                        table_name,
                        table_name::text as join_path,
                        1 as depth
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE 'game_character_%'
                    
                    UNION
                    
                    -- Recursive case: find foreign key relationships
                    SELECT 
                        ccu.table_name,
                        rt.join_path || '(' || ccu.table_name::text || ')',
                        rt.depth + 1
                    FROM related_tables rt
                    JOIN information_schema.table_constraints tc 
                        ON tc.table_name = rt.table_name
                    JOIN information_schema.constraint_column_usage ccu 
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public'
                    AND rt.depth < 3  -- Limit depth to prevent infinite recursion
                )
                SELECT DISTINCT 
                    table_name,
                    join_path,
                    depth
                FROM related_tables
                ORDER BY depth, table_name;
            """)
            
            return [
                {
                    'table': row[0],
                    'join_path': row[1],
                    'depth': row[2]
                }
                for row in cur.fetchall()
            ]

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

// Realtime event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type RealtimePayload<T> = {{
    eventType: RealtimeEvent;
    new: T | null;
    old: T | null;
}};

// Specific rule types
{chr(10).join(f'''export type {to_ts_name(table, True)} = GameRule<"{table}">;
export type {to_ts_name(table, True)}Insert = GameRuleInsert<"{table}">;
export type {to_ts_name(table, True)}Update = GameRuleUpdate<"{table}">; ''' for table in sorted(tables))}"""

def generate_relationships_interface(relationships: Dict[str, List[Tuple[str, str]]]) -> str:
    """Generate TypeScript interface for relationship caching"""
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
/** Relationship cache structure */
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
            table_type = to_ts_name(table, True)
            
            functions.append(f"""
    async {function_name}(ids: number[]): Promise<Record<number, {foreign_type}[]>> {{
        // Skip if no ids provided
        if (!ids.length) return {{}};

        // Filter out ids that are already cached
        const uncachedIds = ids.filter(id => !this.relationships.{cache_name}[id]);
        
        if (uncachedIds.length > 0) {{
            // Load uncached relationships in bulk
            const {{ data, error }} = await (this.supabase
                .from('{table}')
                .select(`
                    id,
                    {column},
                    {foreign_table}_data:{foreign_table}(*)
                `)
                .in('{column}', uncachedIds)) as unknown as {{
                    data: Array<{{
                        id: number;
                        {column}: number;
                        {foreign_table}_data: {foreign_type};
                    }}> | null;
                    error: any;
                }};
            
            if (error) throw new Error(`Error fetching {foreign_table} for {table}: ${{error.message}}`);
            if (!data) return {{}};
            
            // Group results by {column}
            const results: Record<number, {foreign_type}[]> = {{}};
            data.forEach(row => {{
                const id = row.{column};
                if (!results[id]) results[id] = [];
                if (row.{foreign_table}_data) {{
                    results[id].push(row.{foreign_table}_data);
                }}
            }});
            
            // Update cache
            Object.entries(results).forEach(([idStr, value]) => {{
                const id = Number(idStr);
                this.relationships.{cache_name}[id] = value;
            }});
        }}
        
        // Return requested relationships from cache
        return Object.fromEntries(
            ids.map(id => [
                id,
                this.relationships.{cache_name}[id] || []
            ])
        );
    }}""")
    
    return "\n".join(functions)

def generate_table_operations_class() -> str:
    """Generate the base TableOperations class with bulk operations"""
    return """
/** Base class for table operations with caching and realtime updates */
export class TableOperations<T extends { id: number }, TInsert, TUpdate extends { id: number }> {
    private cache = new Map<number, T>();
    private allDataLoaded = false;
    private channel: RealtimeChannel | null = null;

    constructor(
        private supabase: SupabaseClient,
        private tableName: string
    ) {
        if (!tableName) throw new Error('Table name is required');
    }

    /** Get all records from the table with caching */
    async getAll(): Promise<T[]> {
        try {
            if (this.allDataLoaded) {
                return Array.from(this.cache.values());
            }

            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('id');
            if (error) throw error;
            
            // Update cache
            data?.forEach(item => this.cache.set(item.id, item as T));
            this.allDataLoaded = true;
            return data as T[] || [];
        } catch (error) {
            console.error(`Error fetching all ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Get a single record by ID with caching */
    async getById(id: number): Promise<T | null> {
        try {
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
            if (data) this.cache.set(data.id, data as T);
            return data as T;
        } catch (error) {
            console.error(`Error fetching ${this.tableName} by id:`, error);
            throw error;
        }
    }

    /** Get multiple records by IDs with caching */
    async getByIds(ids: number[]): Promise<T[]> {
        try {
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
                data?.forEach(item => this.cache.set(item.id, item as T));
            }
            
            // Return all requested items from cache
            return ids.map(id => this.cache.get(id)).filter((item): item is T => item != null);
        } catch (error) {
            console.error(`Error fetching ${this.tableName} by ids:`, error);
            throw error;
        }
    }

    /** Create a new record */
    async create(newItem: TInsert): Promise<T> {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert(newItem)
                .select()
                .single();
            if (error) throw error;
            if (!data) throw new Error(`Failed to create ${this.tableName}`);
            
            // Update cache
            const result = data as T;
            this.cache.set(result.id, result);
            return result;
        } catch (error) {
            console.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Update an existing record */
    async update(changes: TUpdate): Promise<T> {
        try {
            const { id } = changes;
            if (!id) throw new Error(`update${this.tableName}: missing "id" field`);
            
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update(changes)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            if (!data) throw new Error(`Failed to update ${this.tableName}`);
            
            // Update cache
            const result = data as T;
            this.cache.set(result.id, result);
            return result;
        } catch (error) {
            console.error(`Error updating ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Delete a record */
    async delete(id: number): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);
            if (error) throw error;
            
            // Remove from cache
            this.cache.delete(id);
            return true;
        } catch (error) {
            console.error(`Error deleting ${this.tableName}:`, error);
            throw error;
        }
    }

    /** Watch for realtime changes */
    watch(
        onChange: (type: 'insert' | 'update' | 'delete', row: T, oldRow?: T) => void
    ): () => void {
        if (this.channel) {
            this.stopWatch();
        }

        this.channel = this.supabase
            .channel(`${this.tableName}_changes`)
            .on<T>(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' && payload.new) {
                        const newRow = payload.new as T;
                        this.cache.set(newRow.id, newRow);
                        onChange('insert', newRow);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        const newRow = payload.new as T;
                        this.cache.set(newRow.id, newRow);
                        onChange('update', newRow, payload.old as T);
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        const oldRow = payload.old as T;
                        this.cache.delete(oldRow.id);
                        onChange('delete', oldRow);
                    }
                }
            )
            .subscribe();

        return () => this.stopWatch();
    }

    /** Stop watching for realtime changes */
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
    method_declarations = []

    for table in tables:
        type_name = to_ts_name(table, True)
        ops_var = f"{table}Ops"
        
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

    return chr(10).join(method_declarations)

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

def generate_preload_method(tables: List[str]) -> Tuple[str, str]:
    """Generate the preloadCommonData method and its interface"""
    # Create proper type imports and interface
    interface_fields = []
    
    for table in sorted(tables):
        type_name = to_ts_name(table, True)
        field_name = 'classData' if table == 'class' else table
        interface_fields.append(f'    {field_name}?: {type_name}[];')
        
    interface = f"""/** Interface for preloading common game data */
export interface PreloadTableData {{
{chr(10).join(interface_fields)}
}}"""
    
    method = f"""
    /**
     * Preload common game data into cache
     * @param data Partial data to preload
     * @returns The preloaded data
     */
    preloadCommonData = async (data: Partial<PreloadTableData>): Promise<PreloadTableData> => {{
        // Validate input
        if (!data || typeof data !== 'object') {{
            throw new Error('Invalid data provided to preloadCommonData');
        }}

        try {{
            // Update cache for each table
            Object.entries(data).forEach(([tableName, items]) => {{
                if (Array.isArray(items)) {{
                    const opsKey = tableName === 'classData' ? 'classOps' : `${{tableName}}Ops`;
                    const ops = this[opsKey];
                    if (ops) {{
                        items.forEach(item => {{
                            if (item && typeof item === 'object' && 'id' in item) {{
                                ops.cache.set(item.id, item);
                            }}
                        }});
                        ops.allDataLoaded = true;
                    }}
                }}
            }});

            return data;
        }} catch (error) {{
            console.error('Error in preloadCommonData:', error);
            throw error;
        }}
    }};"""
    
    return interface, method

def generate_optimized_queries() -> str:
    """Generate optimized query methods with joins"""
    return """
    /** Get ABP cache data with optimized joins */
    async getAbpCacheData(effectiveLevel: number, chosenNodeIds: number[]) {
        const [nodesResult, chosenNodesResult] = await Promise.all([
            this.supabase
                .from('abp_node')
                .select(`
                    *,
                    abp_node_group!inner(*),
                    abp_node_bonus(
                        *,
                        abp_bonus_type(*)
                    )
                `)
                .lt('abp_node_group.level', effectiveLevel),

            this.supabase
                .from('abp_node')
                .select(`
                    *,
                    abp_node_bonus(
                        *,
                        abp_bonus_type(*)
                    )
                `)
                .in('id', chosenNodeIds)
        ]);

        return {
            nodes: nodesResult.data || [],
            chosenNodes: chosenNodesResult.data || []
        };
    }
"""

def generate_complete_character_query(related_tables: List[Dict[str, Any]]) -> str:
    """Generate the complete character query with all related tables"""
    select_parts = ['*']
    
    for table in related_tables:
        base_name = table['table']
        # Build the select part with proper nesting
        select_part = f"{base_name}:{base_name}(*"
        
        # Add nested selects for foreign key relationships
        if table['depth'] == 1:
            # For direct character relationships, check for secondary relationships
            select_part += f", {table['table'].replace('game_character_', '')}(*)"
            
        select_part += ")"
        select_parts.append(select_part)
    
    return f"""    async getCompleteCharacterData(characterId: number): Promise<CompleteCharacter | null> {{
        const {{ data, error }} = await this.supabase
            .from('game_character')
            .select(`
                {',\\n                '.join(select_parts)}
            `)
            .eq('id', characterId)
            .single();

        if (error) throw error;
        return data;
    }}"""

def generate_game_rules_api(tables: List[str], relationships: Dict[str, List[Tuple[str, str]]], dsn: str) -> str:
    """Generate the complete game rules API"""
    # Get character grain types and methods separately
    character_types, character_methods = generate_character_grain_function(relationships)
    
    # Get preload interface and method separately
    preload_interface, preload_method = generate_preload_method(tables)

    # Generate table operations initialization
    table_ops_init = '\n'.join(
        f'        this.{table}Ops = new TableOperations<{to_ts_name(table, True)}, {to_ts_name(table, True)}Insert, {to_ts_name(table, True)}Update>(supabase, "{table}");'
        for table in sorted(tables)
    )

    # Create cache interface
    cache_interface = "    private cache: {\n"
    cache_interface += "\n".join(f"        {table}?: {to_ts_name(table, True)}[];" for table in tables)
    cache_interface += "\n    } = {};\n"

    # Generate batch query methods
    batch_methods = """
    async getCharacterRelatedData(characterId: number) {
        const { data, error } = await this.supabase
            .from('game_character')
            .select(`
                *,
                game_character_class (*),
                game_character_skill_rank (*),
                game_character_ability (*),
                game_character_feat (*)
            `)
            .eq('id', characterId)
            .single();

        if (error) throw error;
        return data;
    }

    watchCharacterRelatedTables(
        characterId: number,
        onChange: (changes: {
            type: 'insert' | 'update' | 'delete';
            table: string;
            row: any;
            oldRow?: any;
        }) => void
    ) {
        const tables = [
            'game_character',
            'game_character_class',
            'game_character_skill_rank',
            'game_character_ability',
            'game_character_feat'
        ];

        const channels = tables.map(table =>
            this.supabase
                .channel(`${table}_changes_${characterId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table,
                        filter: `game_character_id=eq.${characterId}`
                    },
                    (payload) => {
                        onChange({
                            type: payload.eventType as 'insert' | 'update' | 'delete',
                            table,
                            row: payload.new,
                            oldRow: payload.old
                        });
                    }
                )
                .subscribe()
        );

        return () => channels.forEach(channel => {
            try {
                this.supabase.removeChannel(channel);
            } catch (err) {
                console.error('Error removing channel:', err);
            }
        });
    }
"""

    # Get character-related tables
    character_related = get_character_related_tables(dsn)
    
    # Generate the complete character query
    complete_character_query = generate_complete_character_query(character_related)

    return f"""
/**
 * Game Rules API
 * Generated {datetime.now().isoformat()}
 * 
 * Provides type-safe access to game rules with relationship handling, CRUD operations, and realtime updates.
 */

 import type {{ SupabaseClient }} from '@supabase/supabase-js';
import {{ RealtimeChannel }} from '@supabase/supabase-js';
import type {{ Database }} from '$lib/domain/types/supabase';

{generate_types(tables)}

{character_types}

{preload_interface}

{generate_relationships_interface(relationships)}

{generate_table_operations_class()}

export class GameRulesAPI {{
    [key: string]: any;

    private relationships: GameRuleRelationships = {{
        {','.join(f'{rel}: {{}}' for rel in sorted({f'{to_ts_name(foreign_table)}By{to_ts_name(column, True)}' for table, rels in relationships.items() for column, foreign_table in rels}))}
    }};

    // Watcher management
    private watchers: Array<() => void> = [];

    // Table operations instances
    {chr(10).join(f'    private {table}Ops!: TableOperations<{to_ts_name(table, True)}, {to_ts_name(table, True)}Insert, {to_ts_name(table, True)}Update>;' for table in sorted(tables))}
    
    constructor(private supabase: SupabaseClient) {{
        if (!supabase) throw new Error('Supabase client is required');
{table_ops_init}
    }}

{generate_crud_functions(tables)}

{preload_method}

    // Relationship functions
{generate_relationship_functions(relationships)}

    // Character grain functions
{character_methods}

    // Batch operations
{batch_methods}

    // Optimized queries with joins
{generate_optimized_queries()}

    // Complete character query
{complete_character_query}
}}
"""

def generate_game_rules_code(dsn: str) -> None:
    """Generate all game rules TypeScript code"""
    # Get schema info
    tables, relationships = get_game_tables(dsn)
    
    # Create output directory
    # os.makedirs('src/gameRules', exist_ok=True)
    
    # Generate API file
    api_content = generate_game_rules_api(tables, relationships, dsn)
    
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