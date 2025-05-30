# Game Data Directory

This directory contains the main Pathfinder game data files.

- **pathfinder_data.yaml** - The main game data file with all rules, classes, etc.
- **split/** - Directory for split YAML files (created when you run `npm run yaml:split`)

## Working with the Data

The YAML tools allow you to split, edit, and combine the data:

```bash
# Split the main file into multiple files
npm run yaml:split

# Combine the split files back into a single file
npm run yaml:combine
```

All anchor/alias relationships are preserved during splitting and combining.