# YAML Tools

This directory contains utilities for managing YAML data across multiple files while truly preserving anchors and aliases.

## Advanced Anchor Preservation

The tools in this directory solve the challenge of working with YAML anchors and aliases across multiple files. Unlike standard YAML splitting approaches that reify aliases (convert them to their actual values), these tools preserve the raw anchor/alias syntax in each file.

## Recommended Workflow

1. **Split your YAML file**:
   ```bash
   npm run yaml:split
   ```
   This creates split files in `data/split` directory with preserved anchors/aliases.
2. **Edit your split files**:
   Edit the files while maintaining the anchor/alias syntax:
   - Anchors look like: `&anchor_name`
   - Aliases look like: `*anchor_name`
3. **Combine your files**:
   ```bash
   npm run yaml:combine
   ```
   This combines the files back into `data/pathfinder_data.yaml` with all anchor/alias relationships intact.
4. **Load to database**:
   ```bash
   npm run yaml:load
   ```

## Complete Pipeline

For a guided experience, use the pipeline script:

```bash
npm run yaml:pipeline
```

This will take you through the entire process step-by-step, with opportunities to edit files between steps.

## Key Features

- **True Anchor/Alias Preservation**: The raw YAML anchor/alias syntax is maintained in split files
- **Cross-file References**: Aliases can reference anchors defined in other files
- **Edit-friendly**: Edit values while maintaining the relationship between anchors and aliases
- **Seamless Combination**: Combining files preserves all anchor/alias relationships

## Core Utilities

The utilities in the `core/` directory provide the essential functionality:

- **yaml_pipeline.js** - Complete pipeline script for the entire workflow
- **advanced_yaml_splitter.py** - Script to split YAML file into multiple files while preserving anchors/aliases
- **advanced_yaml_combiner.py** - Script to combine YAML files with preserved anchors/aliases

## Note on YAML Anchors/Aliases

YAML anchors and aliases are typically lost during the splitting process. The approach we've implemented:

1. Identifies all anchors in the original file
2. Creates a `00-anchors.yaml` file with the anchor definitions
3. Splits the data by top-level keys
4. Provides instructions for manually restoring alias references

When editing split files, you'll need to manually replace reified values with aliases as needed.

## Best Practices

1. **Use numeric prefixes** for filenames to control load order (e.g., 01-core.yaml)
2. **Group related anchors** in the same file when possible
3. **Reference 00-anchors.yaml** when editing split files to see anchor definitions
