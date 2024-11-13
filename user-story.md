# User Story: Managing a Pathfinder Character Sheet

## As a Pathfinder player

I want to track my character's stats, HP, and consumables digitally
So that I can focus on playing the game instead of managing paper sheets

## Background

- I play a Level 5 Tengu Alchemist named Vardon Salvador
- During combat, I frequently need to:
  - Track HP changes
  - Use bombs and other consumables
  - Apply/remove buffs
  - Check my skills and attributes

## Acceptance Criteria

### Core Features

1. View character basics:

   - Name, race, class, and level
   - Current and maximum HP
   - Base attributes (STR, DEX, CON, INT, WIS, CHA)

2. Track combat resources:

   - Number of bombs remaining
   - Base attack bonus
   - Consumables (Alchemist's Fire, Acid, Tanglefoot)

3. Update values:
   - Can modify HP as damage is taken or healed
   - Can decrease bombs as they're used
   - Can track consumable usage
   - Can modify attribute scores

### User Experience

- All updates should be immediate and persist between sessions
- Should work on both desktop and mobile devices
- Should be usable offline with sync when back online
- Should prevent invalid inputs (negative HP, etc.)

### Technical Requirements

- Data should be stored in Supabase
- Should use Svelte 5's new runes syntax
- Should handle loading and error states gracefully
- Should provide feedback when updates succeed/fail

## Out of Scope (Future Features)

- User authentication
- Multiple character support
- Spell slot tracking
- Buff duration tracking
- Character creation
- Level up management
