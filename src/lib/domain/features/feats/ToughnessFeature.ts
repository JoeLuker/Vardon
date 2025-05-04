import type { Entity } from '../../types/EntityTypes';
import type { Feature } from '../../types/FeatureTypes';
import type { BonusSubsystem } from '../../types/SubsystemTypes';

export const ToughnessFeature: Feature = {
  id: 'feat.toughness',
  name: 'Toughness',
  requiredSubsystems: ['bonus'],
  description: 'You gain +3 hit points. For every Hit Die you possess beyond 3, you gain an additional +1 hit point. If you have more than 3 Hit Dice, you gain +1 hit points whenever you gain a Hit Die (such as when you gain a level).',
  category: 'general',
  persistent: true,
  
  apply(entity: Entity, options: {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    
    // Store feat in character data if not already there
    if (!entity.character) entity.character = {};
    if (!entity.character.feats) entity.character.feats = [];
    
    // Check if character already has this feat
    const alreadyHasFeat = entity.character.feats.some(feat => feat.id === this.id);
    if (!alreadyHasFeat) {
      entity.character.feats.push({
        id: this.id,
        name: this.name
      });
    }
    
    // Calculate the bonus - base 3 + 1 per HD above 3
    const characterLevel = this.getCharacterLevel(entity);
    let hpBonus = 3;
    
    if (characterLevel > 3) {
      hpBonus += (characterLevel - 3);
    }
    
    // Apply the bonus to hit points
    bonus.addBonus(
      entity,
      'max_hp',
      hpBonus,
      'untyped',
      'Toughness'
    );
    
    return {
      success: true,
      hpBonus
    };
  },
  
  unapply(entity: Entity, options: {}, subsystems: { bonus: BonusSubsystem }) {
    const { bonus } = subsystems;
    
    // Remove the bonus
    bonus.removeBonus(entity, 'max_hp', 'Toughness');
    
    return {
      success: true
    };
  },
  
  // Helper to calculate character level
  getCharacterLevel(entity: Entity): number {
    if (!entity.character) return 0;
    
    // If level is directly available, use that
    if (entity.character.level) {
      return entity.character.level;
    }
    
    // Otherwise, sum up class levels
    if (entity.character.classes) {
      return entity.character.classes.reduce((sum, cls) => sum + cls.level, 0);
    }
    
    // If there are game_character_class entries, calculate from those
    if (entity.character.game_character_class) {
      return entity.character.game_character_class.reduce((sum, cls) => sum + (cls.level || 0), 0);
    }
    
    return 0;
  }
};