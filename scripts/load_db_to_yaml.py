import yaml
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os
import logging
from collections import defaultdict
from decimal import Decimal

# Add logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Columns to exclude from export
EXCLUDED_COLUMNS = {'created_at', 'updated_at'}

def get_table_relationships(cur):
    """Get all foreign key relationships in the database."""
    cur.execute("""
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    """)
    return cur.fetchall()

class NoQuoteDumper(yaml.SafeDumper):
    def ignore_aliases(self, data):
        return True

# Add custom representer for strings that start with & or *
def represent_str(dumper, data):
    style = None  # None means no quotes
    # Always use no quotes for labels and names
    if isinstance(data, str):
        if data.startswith('&') or data.startswith('*'):
            style = None
        elif data.startswith('"') and data.endswith('"'):
            # Strip existing quotes if present
            data = data[1:-1]
            style = None
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style=style)

# Add custom representer for Decimal
def represent_decimal(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:float', str(data))

def export_db_to_yaml(dsn, output_file):
    """
    Exports database tables to a YAML file format, excluding specified columns.
    
    :param dsn: Database connection string
    :param output_file: Path where the YAML file should be saved
    """
    logger.info("Starting database export to YAML")
    
    try:
        with psycopg2.connect(dsn) as conn:
            with conn.cursor() as cur:
                # Get foreign key relationships first
                relationships = get_table_relationships(cur)
                
                # Create a mapping of tables that should be processed first (referenced tables)
                table_dependencies = defaultdict(set)
                referenced_tables = set()
                for table, column, ref_table, ref_column in relationships:
                    table_dependencies[table].add(ref_table)
                    referenced_tables.add(ref_table)
                
                # Get list of all tables in dependency order
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                all_tables = [table[0] for table in cur.fetchall()]
                
                # Reorder tables based on dependencies
                ordered_tables = []
                # First add tables that are only referenced (no foreign keys)
                for table in all_tables:
                    if table not in table_dependencies and table in referenced_tables:
                        ordered_tables.append(table)
                # Then add the rest
                for table in all_tables:
                    if table not in ordered_tables:
                        ordered_tables.append(table)
                
                # Dictionary to store all table data
                database_data = {}
                # Dictionary to store row anchors
                row_anchors = {}
                # Dictionary to store id->name mappings for each table
                name_mappings = {}
                
                # First pass: collect all names
                for table_name in ordered_tables:
                    try:
                        cur.execute(f"""
                            SELECT id, name 
                            FROM {table_name} 
                            WHERE name IS NOT NULL
                        """)
                        name_mappings[table_name] = {row[0]: row[1] for row in cur.fetchall()}
                    except psycopg2.Error as e:
                        # Skip tables that don't have name column
                        logger.info(f"Skipping name collection for {table_name} - {str(e)}")
                        conn.rollback()  # Roll back the failed transaction
                        continue

                # Second pass: export data with proper references
                for table_name in ordered_tables:
                    logger.info(f"Exporting table: {table_name}")
                    
                    # Get column information
                    cur.execute("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = %s
                        ORDER BY ordinal_position
                    """, (table_name,))
                    columns = [col[0] for col in cur.fetchall() if col[0] not in EXCLUDED_COLUMNS]
                    
                    # Build SELECT statement excluding specified columns
                    columns_sql = sql.SQL(', ').join(map(sql.Identifier, columns))
                    select_statement = sql.SQL("SELECT {} FROM {}").format(
                        columns_sql,
                        sql.Identifier(table_name)
                    )
                    
                    cur.execute(select_statement)
                    rows = cur.fetchall()
                    
                    # Convert rows to list of dictionaries with anchors
                    table_data = []
                    for row in rows:
                        row_dict = {}
                        for i, value in enumerate(row):
                            if value is not None:
                                col_name = columns[i]
                                # Check if this column is a foreign key
                                for rel_table, rel_col, ref_table, ref_col in relationships:
                                    if rel_table == table_name and rel_col == col_name:
                                        # Use the name from our mapping for the foreign key
                                        ref_name = name_mappings.get(ref_table, {}).get(value)
                                        if ref_name:
                                            value = f"*{ref_table}_{ref_name}_id"
                                        break
                                else:
                                    # If this is a primary key in a referenced table and we have a name mapping, create an anchor
                                    if (table_name in referenced_tables and col_name == 'id' 
                                        and table_name in name_mappings):
                                        name = name_mappings[table_name].get(value)
                                        if name:
                                            value = f"&{table_name}_{name}_id {value}"
                                row_dict[col_name] = value
                        table_data.append(row_dict)
                    
                    # Only add table if it has data
                    if table_data:
                        database_data[table_name] = table_data
        
        # Write to YAML file with custom string handling
        logger.info(f"Writing data to {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            dumper = NoQuoteDumper
            dumper.add_representer(str, represent_str)
            dumper.add_representer(Decimal, represent_decimal)
            yaml.dump(database_data, f, 
                     Dumper=dumper,
                     default_flow_style=False, 
                     allow_unicode=True, 
                     sort_keys=False)
            
        logger.info("Database export completed successfully!")
        
    except Exception as e:
        logger.error(f"Failed to export database to YAML: {str(e)}")
        raise

if __name__ == "__main__":
    # Force reload of environment variables
    load_dotenv(override=True)
    
    # Get connection details from environment variables
    DB_USER = os.getenv("user")
    DB_PASSWORD = os.getenv("password")
    DB_HOST = os.getenv("host").replace("http://", "")
    DB_PORT = os.getenv("port")
    DB_NAME = os.getenv("dbname")

    # Log the connection details (excluding password)
    logger.info(f"Attempting connection with: host={DB_HOST}, port={DB_PORT}, user={DB_USER}, dbname={DB_NAME}")

    DSN = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT} sslmode=disable"

    # Output YAML file
    OUTPUT_FILE = "database_export.yaml"

    try:
        export_db_to_yaml(DSN, OUTPUT_FILE)
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        exit(1)