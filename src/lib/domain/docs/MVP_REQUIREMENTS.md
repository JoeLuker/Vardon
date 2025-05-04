# Character Engine Requirements

## Core Features

### Character Stats & Calculations

- **Ability Scores**: Calculate total scores with all bonuses and modifiers (STR, DEX, CON, INT, WIS, CHA)
- **Saving Throws**: Base save + ability modifier + bonuses (Fortitude, Reflex, Will)
- **Armor Class**: Calculate normal AC, touch AC, and flat-footed AC
- **Attack Bonuses**: Melee, ranged, and iterative attacks
- **Combat Maneuvers**: CMB and CMD calculations
- **Initiative**: Dexterity-based with additional bonuses
- **Size Modifiers**: Support for size changes and their effects on stats

### Skills System

- **Skill Calculations**: Base ranks + ability mod + class skill bonus + other bonuses
- **Skill Points Management**: Track available and spent skill points per level
- **Class Skills**: Check if skills are class skills for bonus purposes
- **Skill Rank Allocation**: Support adding/removing ranks at specific levels
- **Trained-Only Skills**: Identify skills that require training

### Spellcasting

- **Spell Slots**: Calculate available spell slots per level with bonus slots
- **Spellcasting Class Features**: Track different spellcasting types (prepared/spontaneous)
- **Ability Score Requirements**: Enforce minimum ability scores for spell levels

### Bonus System

- **Bonus Stacking Rules**: Implement Pathfinder rules for stacking/non-stacking bonuses
- **Bonus Sources**: Track the source of each bonus for display and calculation
- **Typed vs. Untyped Bonuses**: Handle different bonus types (enhancement, deflection, etc.)
- **Penalties**: Handle penalties which always stack

### Character Features

- **Class Features**: Apply effects from class features
- **Feats**: Apply effects from feats
- **Traits**: Apply effects from character traits
- **Ancestry Traits**: Apply racial/ancestry bonuses to appropriate stats
- **Corruption System**: Support for vampire corruption and manifestations
- **Equipment**: Apply armor, weapon, and other equipment bonuses

### Special Systems

- **Automatic Bonus Progression (ABP)**: Support for Pathfinder's ABP alternative rules
- **Value Breakdown**: Provide detailed breakdown of where values come from
- **Ability Score Overrides**: Support cases where one ability is used instead of another
- **Level-Based Progressions**: Handle features that scale with class or character level

## Technical Requirements

- **Performance**: Support partial updates for faster UI responsiveness
- **Immutability**: Ensure data structure changes don't cause side effects
- **Caching**: Cache calculated values when appropriate
- **Extensibility**: Support for adding new features, traits, and bonuses

## Implementation Notes

- Character enrichment should be a pure function of input state
- Bonus stacking should follow Pathfinder rules precisely
- All stat calculations should be explainable (provide source and value)
- Support optimized updates for frequently changed values (HP, skill ranks)

<think>The requirements you've provided for your Pathfinder character engine are comprehensive and cover most of the key aspects needed for a functional character management system. Let me analyze what's there and suggest modifications or additions based on your latest comment about homebrew rule support and other potential improvements.

First, let's consider the addition of explicit homebrew support:

1. Homebrew/Rule Override System

- Need a way to explicitly override standard rules
- Should be implemented as plugins
- System should be aware when rules are being broken/overridden
- Should provide clear indication of non-standard rules in effect

Other potential additions or modifications:

2. Event System

- The requirements don't explicitly mention an event system for changes
- Important for UI updates and feature interactions

3. Condition System

- Pathfinder has many conditions (stunned, prone, etc.) that affect characters
- Should track active conditions and their effects on calculations

4. Multiclassing Support

- Explicitly call out multiclassing support (it's implied but not stated)

5. Plugin Dependency Management

- How plugins interact and depend on each other could be more explicit

6. Validation System

- Character validation to ensure rules compliance
- Warning system for potential rule violations

7. API Documentation

- Requirements for how the API should be documented

8. Versioning and Migration

- How to handle changing rules or system updates

## Additional Core Features

### Homebrew and Rule Override System

- **Plugin-Based Overrides**: Implement homebrew as explicit plugins that document rule changes
- **Rule Violation Awareness**: System should log and display when standard rules are being overridden
- **Selective Application**: Allow homebrew rules to be enabled/disabled individually
- **Rules Inheritance**: Support for rule overrides that extend rather than replace base rules

### Development Tooling

- **Feature Testing Tools**: Support for testing homebrew features in isolation
- **Character Snapshots**: Save/load character state for testing and comparison
- **Debugging Helpers**: Tools to trace bonus sources and calculation paths

## Implementation Suggestions

- **Rule Override Layers**: Implement a layered approach where homebrew overrides can be applied at different priority levels
- **Plugin Tagging System**: Tag plugins as "core rules," "official variant," or "homebrew" for clarity
- **Modification History**: Track what modifications have been applied to a character and by which plugins
- **Exportable Configurations**: Allow homebrew rule sets to be exported and shared

## Additional Reference Elements

- **Condition Tracking**: Simple toggles for common conditions (fatigued, sickened, etc.) that auto-adjust relevant stats
- **Resource Tracking**: Track consumable resources (spells per day, abilities with limited uses)
