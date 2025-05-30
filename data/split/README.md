# Split YAML Files with Preserved Anchors

These files were split from a YAML file while preserving anchor and alias references.

## Usage

When working with these files:

1. **Always** load `00-anchors.yaml` FIRST - this contains all anchor definitions.
2. Then you can load or edit the other files with their respective sections.
3. Alias references (like `*alias_name`) rely on the anchor definitions and will work across files.

## Combining the Files

To combine these files back into a single valid YAML:

```bash
python combine_preserve.py this-directory output.yaml
```

This will produce a single YAML file with all anchor/alias relationships intact.
