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
    Loads each top-level list in the YAML file as a table insert.
    
    :param yaml_file_path: Path to the .yaml file
    :param dsn: A PostgreSQL data source name, e.g.:
                "dbname=mydb user=myuser password=mypassword host=127.0.0.1"
    """
    logger.info(f"Starting YAML import from {yaml_file_path}")
    
    try:
        # 1) Read the YAML
        logger.debug("Reading YAML file")
        with open(yaml_file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        
        # 2) Connect to PostgreSQL
        logger.debug("Connecting to PostgreSQL database")
        with psycopg2.connect(dsn) as conn:
            with conn.cursor() as cur:
                # 3) Iterate over top-level keys (tables)
                for table_name, rows in data.items():
                    if table_name in ["metadata", "user_id"]:
                        logger.debug(f"Skipping metadata table: {table_name}")
                        continue
                    if not isinstance(rows, list):
                        logger.warning(f"Skipping non-list data in {table_name}")
                        continue

                    logger.info(f"Processing table: {table_name} with {len(rows)} rows")
                    
                    # 4) Insert each record
                    for idx, row in enumerate(rows, 1):
                        if not isinstance(row, dict):
                            logger.warning(f"Skipping non-dict row in {table_name}")
                            continue
                        
                        try:
                            # Build an INSERT statement dynamically from the dict keys
                            columns = list(row.keys())
                            values = [row[col] for col in columns]
                            
                            # Example: INSERT INTO some_table (col1, col2) VALUES (%s, %s)
                            insert_statement = sql.SQL("INSERT INTO {table} ({fields}) VALUES ({values})").format(
                                table=sql.Identifier(table_name),
                                fields=sql.SQL(", ").join(map(sql.Identifier, columns)),
                                values=sql.SQL(", ").join([sql.Placeholder()] * len(columns))
                            )
                            
                            cur.execute(insert_statement, values)
                            logger.debug(f"Inserted row {idx} into {table_name}")
                        except Exception as e:
                            logger.error(f"Error inserting row {idx} into {table_name}: {str(e)}")
                            raise
                
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
    # Replace with your actual DSN parameters
    DB_USER = os.getenv("user")
    DB_PASSWORD = os.getenv("password")
    DB_HOST = os.getenv("host")
    DB_PORT = os.getenv("port")
    DB_NAME = os.getenv("dbname")

    DSN = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"

    # Path to the YAML file
    YAML_FILE = "pathfinder_data.yaml"

    try:
        load_yaml_to_db(YAML_FILE, DSN)
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        exit(1)