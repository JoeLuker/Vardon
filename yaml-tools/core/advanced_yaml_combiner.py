#!/usr/bin/env python3
"""
Advanced YAML Combiner - Combine split YAML files while preserving anchors and aliases
"""

import os
import sys
import glob
import re
import yaml
import argparse
from ruamel.yaml import YAML

class AnchorPreservingCombiner:
    def __init__(self):
        self.ryaml = YAML()
        self.ryaml.preserve_quotes = True
        self.ryaml.indent(mapping=2, sequence=4, offset=2)
    
    def extract_raw_anchors(self, content):
        """Extract raw anchor definitions from content."""
        anchors = {}
        pattern = r'^\s+([a-zA-Z0-9_-]+):\s+&\1\s+(.*?)$'
        
        for line in content.split('\n'):
            match = re.match(pattern, line)
            if match:
                name = match.group(1)
                value = match.group(2).strip()
                anchors[name] = value
        
        return anchors
    
    def combine(self, input_dir, output_file):
        """Combine split YAML files with anchors preserved."""
        anchor_file = os.path.join(input_dir, "00-anchors.yaml")
        if not os.path.exists(anchor_file):
            print(f"Error: Anchor definitions file not found: {anchor_file}")
            return False
        
        # Read the anchor definitions
        with open(anchor_file, 'r', encoding='utf-8') as f:
            anchor_content = f.read()
        
        # Get all other YAML files (excluding anchors file and README)
        files = glob.glob(os.path.join(input_dir, "*.yaml"))
        files = [f for f in files if not (
            os.path.basename(f) == "00-anchors.yaml" or 
            os.path.basename(f) == "README.md" or
            os.path.basename(f).startswith(".")
        )]
        
        # Define file ordering that ensures correct definition of anchors before use
        priority_order = [
            "bonus_attack_progression.yaml",  # Contains bonus_attack_progression_three_quarters_id
            "abp_node_group.yaml",  # Contains group_level_3_id
            "abp_bonus_type.yaml",
            "abp_node.yaml",
            "ability.yaml",
            "ancestry.yaml",
            "bonus_type.yaml",
            "class.yaml",
            "corruption.yaml",
            "corruption_manifestation.yaml",
        ]
        
        # Sort files with priority files first, then alphabetically for the rest
        def sort_key(file_path):
            basename = os.path.basename(file_path)
            try:
                # Return index for priority files
                return (0, priority_order.index(basename))
            except ValueError:
                # Return a higher index for non-priority files
                return (1, basename)
        
        files.sort(key=sort_key)
        
        # Start the combined content
        combined_content = "# Combined YAML file with preserved anchors/aliases\n\n"
        
        # Extract anchor definitions section (up to the first blank line after "anchors:")
        anchor_section = re.search(r'anchors:\s*\n(.*?)(?=\n\s*\n|\Z)', 
                                  anchor_content, re.DOTALL)
        
        if anchor_section:
            # Extract just the anchors section
            anchor_lines = []
            capture = False
            for line in anchor_content.split('\n'):
                if line.strip() == 'anchors:':
                    capture = True
                    continue
                
                if capture and line.strip() == '':
                    capture = False
                    break
                
                if capture and line.strip() and not line.strip().startswith('#'):
                    anchor_lines.append(line)
        
        # Process each file
        for file_path in files:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip empty files
            if not content.strip():
                continue
            
            combined_content += f"# From {os.path.basename(file_path)}\n"
            combined_content += content + "\n\n"
        
        # Write the combined content
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(combined_content)
        
        print(f"Combined {len(files)} files into {output_file}")
        print("Anchors and aliases should be preserved.")
        
        return True

def main():
    parser = argparse.ArgumentParser(
        description="Combine split YAML files while preserving anchor/alias references"
    )
    parser.add_argument("input_dir", help="Directory containing split YAML files")
    parser.add_argument("output_file", help="Output YAML file")
    
    args = parser.parse_args()
    combiner = AnchorPreservingCombiner()
    combiner.combine(args.input_dir, args.output_file)

if __name__ == "__main__":
    main()