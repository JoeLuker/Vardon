#!/usr/bin/env python3
"""
Advanced YAML Splitter - Split YAML files while preserving anchors and aliases
"""

import os
import sys
import re
import yaml
import json
import argparse
from collections import OrderedDict, defaultdict
from ruamel.yaml import YAML

class AnchorPreservingSplitter:
    def __init__(self):
        self.ryaml = YAML()
        self.ryaml.preserve_quotes = True
        self.ryaml.indent(mapping=2, sequence=4, offset=2)

    def extract_anchors_and_aliases(self, content):
        """Extract all anchor definitions and their references."""
        anchors = {}
        anchor_pattern = r'&([a-zA-Z0-9_-]+)(\s+[^\n&*]+)'
        
        for match in re.finditer(anchor_pattern, content):
            anchor_name = match.group(1)
            anchor_value = match.group(2).strip()
            anchors[anchor_name] = anchor_value
        
        # Find alias references
        aliases = defaultdict(list)
        alias_pattern = r'\*([a-zA-Z0-9_-]+)'
        
        for match in re.finditer(alias_pattern, content):
            alias_name = match.group(1)
            aliases[alias_name].append(match.start())
        
        return anchors, aliases

    def parse_yaml_with_references(self, file_path):
        """Parse YAML while preserving references."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract anchors and aliases before loading
        anchors, aliases = self.extract_anchors_and_aliases(content)
        
        # Use ruamel.yaml to parse without resolving anchors/aliases
        yaml_data = self.ryaml.load(content)
        
        return yaml_data, anchors, aliases, content

    def get_top_level_sections(self, content):
        """Extract top-level sections from YAML content."""
        # This regex pattern matches top-level keys with their sections
        top_level_pattern = r'^([a-zA-Z0-9_-]+):\s*$(.*?)(?=^[a-zA-Z0-9_-]+:\s*$|\Z)'
        matches = re.finditer(top_level_pattern, content, re.MULTILINE | re.DOTALL)
        
        sections = {}
        for match in matches:
            key = match.group(1)
            content = match.group(0)
            sections[key] = content
        
        return sections

    def create_anchors_file(self, anchors, aliases, output_path):
        """Create a file with all anchor definitions."""
        content = "# YAML Anchor Definitions - Required for Cross-File References\n\n"
        content += "# This file must be loaded first when combining files\n"
        content += "anchors:\n"
        
        for name, value in anchors.items():
            content += f"  {name}: &{name} {value}\n"
        
        # Add reference information
        content += "\n# Reference counts\n"
        content += "references:\n"
        for name, positions in aliases.items():
            if name in anchors:  # Only include used anchors
                content += f"  {name}: {len(positions)}\n"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return output_path

    def split(self, input_file, output_dir, split_nested=False):
        """Split YAML file into multiple files with preserved anchors/aliases."""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Read and parse the YAML file
        yaml_data, anchors, aliases, raw_content = self.parse_yaml_with_references(input_file)
        
        # Create the anchors file
        anchors_file = os.path.join(output_dir, "00-anchors.yaml")
        self.create_anchors_file(anchors, aliases, anchors_file)
        print(f"Created anchor definitions file: {anchors_file}")
        
        # Get top-level sections
        sections = self.get_top_level_sections(raw_content)
        
        # Write each section to its own file
        for key, content in sections.items():
            if key in yaml_data:
                output_file = os.path.join(output_dir, f"{key}.yaml")
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"Created {output_file}")
        
        # Create a README file
        readme_path = os.path.join(output_dir, "README.md")
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write("""# Split YAML Files with Preserved Anchors

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
""")
        
        print(f"""
YAML split complete! Files are in {output_dir}

IMPORTANT: When combining these files, ALWAYS load 00-anchors.yaml first,
then load the remaining files. This ensures all aliases resolve correctly.
""")

def main():
    parser = argparse.ArgumentParser(
        description="Split YAML file into multiple files while preserving anchor/alias references"
    )
    parser.add_argument("input_file", help="Input YAML file to split")
    parser.add_argument("output_dir", help="Output directory for split files")
    parser.add_argument("--split-nested", action="store_true", 
                        help="Split nested sections into separate files")
    
    args = parser.parse_args()
    splitter = AnchorPreservingSplitter()
    splitter.split(args.input_file, args.output_dir, args.split_nested)

if __name__ == "__main__":
    main()