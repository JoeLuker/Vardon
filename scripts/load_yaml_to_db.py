import yaml
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os
import logging

# Add logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

load_dotenv()

def load_yaml_to_db(yaml_file_path, dsn):
    """
    Loads tables from a YAML file assuming all tables are in the public schema.
    
    :param yaml_file_path: Path to the .yaml file
    :param dsn: PostgreSQL connection string
    """
    logger.info(f"Starting YAML import from {yaml_file_path}")
    
    try:
        # 1) Read the YAML with preserving anchors
        logger.debug("Reading YAML file")
        with open(yaml_file_path, "r", encoding="utf-8") as f:
            # Use full_load to preserve anchors and aliases
            data = yaml.safe_load(f)
        
        # 2) Connect to PostgreSQL
        logger.debug("Connecting to PostgreSQL database")
        with psycopg2.connect(dsn) as conn:
            with conn.cursor() as cur:
                # 3) Process all top-level keys as tables in the public schema
                for table_name, rows in data.items():
                    if not isinstance(rows, list):
                        logger.warning(f"Skipping non-list data in public.{table_name}")
                        continue
                    
                    schema_table_name = f"public.{table_name}"
                    logger.info(f"Processing table: {schema_table_name} with {len(rows)} rows")
                        
                    # Truncate the table before inserting new data
                    truncate_statement = sql.SQL("TRUNCATE TABLE {} CASCADE").format(
                        sql.SQL(schema_table_name)
                    )
                    cur.execute(truncate_statement)
                    logger.info(f"Truncated table: {schema_table_name}")
                    
                    # 4) Insert each record
                    columns = []  # Initialize columns outside the loop
                    for idx, row in enumerate(rows, 1):
                        if not isinstance(row, dict):
                            logger.warning(f"Skipping non-dict row in {schema_table_name}")
                            continue
                        
                        try:
                            # Build an INSERT statement dynamically from the dict keys
                            columns = list(row.keys())
                            values = []
                            
                            # Process values, handling references and converting to appropriate DB types
                            for col in columns:
                                val = row[col]
                                # Handle circular references or complex structures by converting to string
                                if not isinstance(val, (str, int, float, bool, type(None))):
                                    try:
                                        val = str(val)
                                    except:
                                        val = None
                                values.append(val)
                            
                            insert_statement = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                                sql.SQL(schema_table_name),
                                sql.SQL(", ").join(map(sql.Identifier, columns)),
                                sql.SQL(", ").join([sql.Placeholder()] * len(columns))
                            )
                            
                            cur.execute(insert_statement, values)
                            logger.debug(f"Inserted row {idx} into {schema_table_name}")
                        except Exception as e:
                            logger.error(f"Error inserting row {idx} into {schema_table_name}: {str(e)}")
                            # Don't fail the whole import for one bad record
                            logger.error(f"Continuing despite error...")
                    
                    # Update the sequence if 'id' column exists
                    if columns and 'id' in columns:
                        try:
                            update_sequence_text = f"""
                            SELECT setval(
                                pg_get_serial_sequence('{schema_table_name}', 'id'),
                                COALESCE((SELECT MAX(id) FROM {schema_table_name}), 0) + 1,
                                false
                            )
                            """
                            update_sequence = sql.SQL(update_sequence_text)
                            cur.execute(update_sequence)
                            logger.info(f"Updated sequence for {schema_table_name}.id")
                        except Exception as e:
                            logger.warning(f"Could not update sequence for {schema_table_name}: {str(e)}")
                
                # 5) Commit once all inserts are done
                conn.commit()
                logger.info("Database transaction committed successfully")
                
    except Exception as e:
        logger.error(f"Failed to load YAML to database: {str(e)}")
        raise
    
    logger.info("YAML data loaded successfully!")

# ------------------------------------------------------------------------------
# Example usage
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    # Force reload of environment variables
    load_dotenv(override=True)
    
    # Replace with your actual DSN parameters
    DB_USER = os.getenv("user")
    DB_PASSWORD = os.getenv("password")
    DB_HOST = os.getenv("host").replace("http://", "") if os.getenv("host") else None
    DB_PORT = os.getenv("port")
    DB_NAME = os.getenv("dbname")

    # Validate environment variables
    missing_vars = []
    if not DB_USER: missing_vars.append("user")
    if not DB_PASSWORD: missing_vars.append("password")
    if not DB_HOST: missing_vars.append("host")
    if not DB_PORT: missing_vars.append("port")
    if not DB_NAME: missing_vars.append("dbname")
    
    if missing_vars:
        logger.error(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.error("Please create a .env file with the required database connection variables")
        exit(1)

    # Log the connection details (excluding password)
    logger.info(f"Attempting connection with: host={DB_HOST}, port={DB_PORT}, user={DB_USER}, dbname={DB_NAME}")

    DSN = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT} sslmode=disable"

    # Path to the YAML file
    YAML_FILE = "data/pathfinder_data.yaml"
    
    if not os.path.exists(YAML_FILE):
        logger.error(f"YAML file not found: {YAML_FILE}")
        logger.error("Please run 'npm run yaml:combine' first to generate the YAML file")
        exit(1)
        
    logger.info(f"YAML file found: {YAML_FILE}, size: {os.path.getsize(YAML_FILE)} bytes")

    try:
        # Print table count in YAML before loading
        with open(YAML_FILE, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            table_count = len(data.keys())
            logger.info(f"Found {table_count} tables in the YAML file")
            
        load_yaml_to_db(YAML_FILE, DSN)
        
        logger.info("✅ Data loaded successfully to the database!")
    except Exception as e:
        logger.error(f"❌ Script failed: {str(e)}")
        exit(1)
