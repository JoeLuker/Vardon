import os
import logging
from typing import Dict, Set, Optional
from dataclasses import dataclass
from ruamel.yaml import YAML
import json
import ruamel.yaml

# Set up logging to track our YAML processing steps
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(message)s",
    handlers=[logging.FileHandler("yaml_split.log", mode="w")]
)

@dataclass
class YAMLDependencyTracker:
    """
    Tracks dependencies between YAML files based on anchor/alias relationships.
    This class helps us understand which files need to reference each other
    to maintain the anchor/alias relationships.
    """
    anchor_locations: Dict[str, str] = None  # Maps anchor names to their defining files
    file_dependencies: Dict[str, Set[str]] = None  # Maps files to their dependencies
    
    def __post_init__(self):
        self.anchor_locations = {}
        self.file_dependencies = {}
    
    def register_anchor(self, anchor_name: str, source_file: str) -> None:
        """Register where an anchor is defined."""
        self.anchor_locations[anchor_name] = os.path.abspath(source_file)
        logging.debug(f"Registered anchor: {anchor_name} in {source_file}")
    
    def register_alias_usage(self, alias_name: str, using_file: str) -> None:
        """Register that a file uses an alias, creating a dependency."""
        using_file = os.path.abspath(using_file)
        if alias_name in self.anchor_locations:
            source_file = self.anchor_locations[alias_name]
            if source_file != using_file:  # Avoid self-dependencies
                if using_file not in self.file_dependencies:
                    self.file_dependencies[using_file] = set()
                self.file_dependencies[using_file].add(source_file)
                logging.debug(f"New dependency: {using_file} needs {source_file} (alias: {alias_name})")

class CrossFileYAML(YAML):
    """
    Custom YAML handler that preserves anchor/alias relationships across file boundaries.
    The key modification is preventing the anchor registry from being cleared between documents.
    """
    def compose_document(self):
        """Override to maintain anchor registry between documents."""
        self.parser.get_event()
        node = self.compose_node(None, None)
        self.parser.get_event()
        # Critical: Don't clear the anchor registry between documents
        # self.anchors = {}  # Original line commented out
        return node

class EventStreamWriter:
    def __init__(self):
        self.depth = 0
        self.current_section = None
        self.events_by_file = {}
        self.current_event_type = None
        self.in_sequence = False
        self.in_document = False
        
    def process_event(self, event):
        assert event is not None, "Received None event"
        self.current_event_type = event.__class__.__name__
        
        # Track document structure
        if isinstance(event, ruamel.yaml.events.StreamStartEvent):
            self.depth = 0
            self.current_section = None
            self.in_sequence = False
            self.in_document = False
            
        elif isinstance(event, ruamel.yaml.events.DocumentStartEvent):
            self.in_document = True
            if not self.current_section:  # Keep section if already set
                self.depth = 0
            
        elif isinstance(event, ruamel.yaml.events.DocumentEndEvent):
            self.in_document = False
            
        elif isinstance(event, ruamel.yaml.events.SequenceStartEvent):
            self.in_sequence = True
            self.depth += 1
            
        elif isinstance(event, ruamel.yaml.events.SequenceEndEvent):
            self.in_sequence = False
            self.depth -= 1
            
        elif isinstance(event, ruamel.yaml.events.MappingStartEvent):
            self.depth += 1
            
        elif isinstance(event, ruamel.yaml.events.MappingEndEvent):
            self.depth -= 1
            
        elif isinstance(event, ruamel.yaml.events.ScalarEvent):
            if self.depth == 0 and not self.in_sequence and self.in_document:
                self.current_section = event.value
        
        # Store event in appropriate file's event stream
        target_file = None
        if self.current_section:
            target_file = self.get_target_file(self.current_section)
            
        if target_file:
            if target_file not in self.events_by_file:
                self.events_by_file[target_file] = []
            # Preserve document structure events
            if isinstance(event, (ruamel.yaml.events.StreamStartEvent, 
                                ruamel.yaml.events.StreamEndEvent,
                                ruamel.yaml.events.DocumentStartEvent,
                                ruamel.yaml.events.DocumentEndEvent)):
                self.events_by_file[target_file].append(event)
            # Store content events only when in a document
            elif self.in_document:
                self.events_by_file[target_file].append(event)
    
    def get_target_file(self, section):
        """Helper method to get the target file for a section from the YAMLSplitter instance."""
        return section_to_file.get(section)

class YAMLSplitter:
    """
    Handles splitting a YAML file while properly managing anchors and aliases across files.
    """
    def __init__(self):
        """Initialize with our custom YAML handler."""
        self.yaml = CrossFileYAML()
        self.yaml.preserve_quotes = True
        self.yaml.width = 4096
        self.yaml.default_flow_style = False
        self.tracker = YAMLDependencyTracker()

    def _process_event(self, event, current_section: Optional[str], section_to_file: Dict[str, str]) -> None:
        """Process a YAML parsing event to track anchors and aliases."""
        if isinstance(event, ruamel.yaml.events.AliasEvent):
            logging.debug(f"Found alias: {event.anchor}")
            if current_section and current_section in section_to_file:
                file = section_to_file[current_section]
                self.tracker.register_alias_usage(event.anchor, file)
        
        elif isinstance(event, (ruamel.yaml.events.ScalarEvent, 
                              ruamel.yaml.events.SequenceStartEvent,
                              ruamel.yaml.events.MappingStartEvent)):
            if event.anchor:
                logging.debug(f"Found anchor: {event.anchor}")
                if current_section and current_section in section_to_file:
                    file = section_to_file[current_section]
                    self.tracker.register_anchor(event.anchor, file)

    def analyze_structure(self, input_file: str, file_mapping: Dict[str, dict]) -> Dict:
        """
        Analyze the YAML structure using event-based parsing to preserve all relationships.
        
        The analysis phase needs to:
        1. Track the full context path through the YAML structure
        2. Maintain proper section mapping even in deeply nested structures
        3. Validate all anchor/alias relationships
        """
        # Validate input parameters
        assert os.path.exists(input_file), f"Input file does not exist: {input_file}"
        assert isinstance(file_mapping, dict), "file_mapping must be a dictionary"
        
        # Create section to file mapping with validation
        logging.info("\nInitializing section to file mapping:")
        section_to_file = {}
        for output_key, mapping_info in file_mapping.items():
            output_path = mapping_info['path']
            if not output_path:
                raise ValueError(f"Missing path for output key: {output_key}")
            
            # Add output directory to path and make absolute
            abs_output_file = os.path.abspath(os.path.join("output", output_path))
            for section in mapping_info['content']:
                assert isinstance(section, str), f"Section name must be string: {section}"
                if section in section_to_file:
                    raise ValueError(f"Duplicate section mapping: {section}")
                section_to_file[section] = abs_output_file
                logging.info(f"  {section} -> {abs_output_file}")
        
        # Track full context path, not just current section
        context_path = []
        current_section = None
        
        with open(input_file) as f:
            data = self.yaml.load(f)
            parsed_data = data
            assert isinstance(parsed_data, dict), "Root YAML structure must be a dictionary"
            
            # Verify all mapped sections exist in the data
            for section_list in file_mapping.values():
                for section in section_list['content']:
                    assert section in parsed_data, f"Mapped section not found in YAML: {section}"
            
            f.seek(0)
            for event in self.yaml.parse(f):
                # Validate event structure
                assert hasattr(event, '__class__'), "Invalid YAML event structure"
                
                # Update context tracking
                if isinstance(event, ruamel.yaml.events.MappingStartEvent):
                    logging.debug(f"Entering new mapping level at {'.'.join(context_path)}")
                    if current_section:
                        context_path.append(current_section)
                elif isinstance(event, ruamel.yaml.events.MappingEndEvent):
                    logging.debug(f"Exiting mapping level from {'.'.join(context_path)}")
                    if context_path:
                        current_section = context_path.pop()
                elif isinstance(event, ruamel.yaml.events.ScalarEvent):
                    # Only update section at appropriate levels
                    if (not context_path and 
                        not isinstance(event, ruamel.yaml.events.AliasEvent)):
                        current_section = event.value
                        logging.debug(f"Processing section: {current_section}")
                
                # Process the event with full context
                self._process_event(event, current_section, section_to_file)
            
            # Verify context is properly cleaned up
            assert not context_path, "Context path not empty after processing"
        
        # Validate all dependencies can be satisfied
        self._validate_dependencies(section_to_file)
        
        # Verify the final structure
        assert isinstance(self.tracker.file_dependencies, dict), "Invalid dependency structure"
        logging.debug(f"Analysis complete. Found {len(self.tracker.file_dependencies)} file dependencies")
        
        return {
            "content": parsed_data,
            "dependencies": self.tracker.file_dependencies
        }

    def _validate_dependencies(self, section_to_file: Dict[str, str]) -> None:
        """
        Ensure all dependencies can be satisfied and detect circular references.
        This validation step is crucial for preventing broken references in the output.
        """
        # Validate input
        assert isinstance(section_to_file, dict), "section_to_file must be a dictionary"
        
        # Check all anchors have valid file mappings
        for anchor, file in self.tracker.anchor_locations.items():
            assert isinstance(anchor, str), f"Invalid anchor name: {anchor}"
            assert isinstance(file, str), f"Invalid file path for anchor {anchor}: {file}"
            assert os.path.isabs(file), f"Invalid anchor location path: {file}"
        
        # Check for circular dependencies
        visited = set()
        path = []
        
        def check_circular(file: str) -> None:
            assert isinstance(file, str), f"Invalid file path in dependency check: {file}"
            if file in path:
                cycle = ' -> '.join(path[path.index(file):] + [file])
                raise ValueError(f"Circular dependency detected: {cycle}")
            if file in visited:
                return
            
            path.append(file)
            visited.add(file)
            
            deps = self.tracker.file_dependencies.get(file, [])
            assert isinstance(deps, (list, set)), f"Invalid dependency structure for {file}"
            
            for dep in deps:
                assert isinstance(dep, str), f"Invalid dependency path: {dep}"
                check_circular(dep)
            
            path.pop()
        
        # Check each file's dependency chain
        for file in self.tracker.file_dependencies:
            check_circular(file)
        
        # Verify all dependencies point to valid files
        all_output_files = set(section_to_file.values())
        for deps in self.tracker.file_dependencies.values():
            for dep in deps:
                assert dep in all_output_files, f"Dependency points to non-existent file: {dep}"

    def write_split_files(self, plan: dict, file_mapping: dict) -> None:
        """
        Write the split YAML files by directly processing the event stream.
        """
        logging.info("\n=== Starting YAML split ===")
        
        # Extract dependencies from plan
        dependencies = plan["dependencies"]
        
        # Group sections by output file
        sections_by_file = {}
        for output_key, mapping_info in file_mapping.items():
            output_path = mapping_info['path']
            abs_output_file = os.path.abspath(os.path.join("output", output_path))
            sections_by_file[abs_output_file] = set(mapping_info['content'])
        
        # First pass: Collect events for each file
        writer = EventStreamWriter()
        with open("pathfinder_data.yaml", 'r') as f:
            for event in self.yaml.parse(f):
                writer.process_event(event)
        
        # Write each file's events
        for output_file, events in writer.events_by_file.items():
            logging.info(f"\nWriting file: {output_file}")
            
            # Create output directory
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            with open(output_file, 'w') as outf:
                # Write include directives if needed
                if output_file in dependencies:
                    for dep in sorted(dependencies[output_file]):
                        rel_dep = os.path.relpath(dep, os.path.dirname(output_file))
                        rel_dep = rel_dep.replace(os.sep, '/')
                        outf.write(f"!include {rel_dep}\n")
                    outf.write("\n---\n")
                
                # Create a new YAML emitter for this file
                yaml_writer = ruamel.yaml.YAML()
                yaml_writer.preserve_quotes = True
                yaml_writer.width = 4096  # Prevent line wrapping
                yaml_writer.default_flow_style = False
                
                # Convert events back to a Python object
                data = self.yaml.compose(events)
                
                # Write the YAML
                yaml_writer.dump(data, outf)
        
        logging.info("\n=== YAML split complete ===")

def main():
    """Main entry point for the YAML splitting process."""
    logging.info("Starting YAML split process")
    
    # Configuration
    input_file = "pathfinder_data.yaml"
    
    # Create output directory if it doesn't exist
    os.makedirs("output", exist_ok=True)

    try:
        with open("file_mapping.json", "r") as f:
            file_mapping = json.load(f)
            
        # Validate file_mapping
        if not isinstance(file_mapping, dict):
            raise ValueError("file_mapping.json must contain a dictionary")
            
        # Process the YAML
        splitter = YAMLSplitter()
        plan = splitter.analyze_structure(input_file, file_mapping)
        splitter.write_split_files(plan, file_mapping)
        
        logging.info("YAML split complete")
    except FileNotFoundError:
        logging.error("file_mapping.json not found")
    except json.JSONDecodeError:
        logging.error("Invalid JSON in file_mapping.json")
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()