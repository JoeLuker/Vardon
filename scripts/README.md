# Database Scripts

This directory contains Python scripts for database operations.

## Scripts

- **load_yaml_to_db.py** - Loads data from the YAML file (`pathfinder_data.yaml`) into the Supabase database
- **load_db_to_yaml.py** - Exports data from the Supabase database to a YAML file

## Usage

### Loading Data to Database

```bash
# From the project root
npm run yaml:load

# Or run directly
python scripts/load_yaml_to_db.py
```

### Exporting Database to YAML

```bash
# Run directly
python scripts/load_db_to_yaml.py
```

## Workflow Integration

These scripts are part of the YAML management workflow:

1. Split the YAML file into multiple files (using yaml-tools)
2. Edit the individual files as needed
3. Combine the files back into a single `pathfinder_data.yaml` file
4. Load the combined file to the database using `load_yaml_to_db.py`

For more details on the complete workflow, see the documentation in the `docs` directory.