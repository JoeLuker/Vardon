/**
 * Migration Tests
 * 
 * This module demonstrates how to migrate existing features to the new plugin system.
 */

import { Entity } from '../kernel/types';
import { BonusCapabilityProvider } from '../capabilities/bonus/BonusCapabilityProvider';
import { PluginManager } from '../plugins/PluginManager';
import { FeatureToPluginMigrator } from '../plugins/migration/FeatureToPluginMigrator';
import { PowerAttackFeature } from '../features/feats/PowerAttackFeature';

/**
 * Run a migration test
 */
export async function runMigrationTest() {
  console.log('=== Running Migration Test ===');
  
  // Create a test entity
  const entity: Entity = {
    id: 'test-entity-1',
    type: 'character',
    name: 'Test Character',
    properties: {
      character: {
        abilities: {
          strength: 16  // Set Strength to 16 to pass Power Attack requirements
        },
        baseAttackBonus: 4  // Set BAB to 4 to pass Power Attack requirements
      }
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  };
  
  // Create the plugin manager
  const pluginManager = new PluginManager({ debug: true });
  
  // Create and register capabilities
  console.log('\nRegistering capabilities...');
  
  // Bonus capability (required by Power Attack)
  const bonusCapability = new BonusCapabilityProvider({
    debug: true,
    stackSameType: false
  });
  pluginManager.registerCapability(bonusCapability);
  
  // Create a migrator
  console.log('\nCreating feature migrator...');
  const migrator = new FeatureToPluginMigrator({ debug: true });
  
  // Migrate Power Attack
  console.log('\nMigrating Power Attack feature to plugin...');
  const powerAttackPlugin = migrator.migrateFeature(PowerAttackFeature);
  
  // Register the migrated plugin
  console.log('\nRegistering migrated plugin...');
  pluginManager.registerPlugin(powerAttackPlugin);
  
  // Initialize the entity
  console.log('\nInitializing entity...');
  pluginManager.initializeEntity(entity);
  
  // Check if Power Attack can be applied
  console.log('\nChecking if Power Attack can be applied...');
  const canApply = pluginManager.canApplyPlugin(entity, 'power_attack');
  console.log(`Can apply Power Attack: ${canApply.valid}${canApply.reason ? ' - ' + canApply.reason : ''}`);
  
  if (canApply.valid) {
    // Apply Power Attack with a -3 attack penalty
    console.log('\nApplying Power Attack with a -3 attack penalty...');
    const result = pluginManager.applyPlugin(entity, 'power_attack', { penalty: 3 });
    
    console.log('Apply result:', result);
    
    // Check bonuses on the entity
    console.log('\nChecking bonuses after applying Power Attack:');
    const meleeAttackBonus = bonusCapability.calculateTotal(entity, 'melee_attack');
    const meleeDamageBonus = bonusCapability.calculateTotal(entity, 'melee_damage');
    
    console.log(`Melee attack bonus: ${meleeAttackBonus}`);
    console.log(`Melee damage bonus: ${meleeDamageBonus}`);
    
    // Show detailed bonus breakdown
    console.log('\nDetailed bonus breakdown:');
    const attackBreakdown = bonusCapability.getBreakdown(entity, 'melee_attack');
    const damageBreakdown = bonusCapability.getBreakdown(entity, 'melee_damage');
    
    console.log('Attack breakdown:', JSON.stringify(attackBreakdown, null, 2));
    console.log('Damage breakdown:', JSON.stringify(damageBreakdown, null, 2));
    
    // Now unapply Power Attack
    console.log('\nUnapplying Power Attack...');
    if (powerAttackPlugin.remove) {
      const requiredCapabilities = pluginManager.getAllCapabilities().reduce((acc, cap) => {
        acc[cap.id] = cap;
        return acc;
      }, {} as Record<string, any>);
      
      const removeResult = powerAttackPlugin.remove(entity, requiredCapabilities);
      console.log('Remove result:', removeResult);
      
      // Check bonuses after removal
      console.log('\nChecking bonuses after removing Power Attack:');
      const meleeAttackBonusAfter = bonusCapability.calculateTotal(entity, 'melee_attack');
      const meleeDamageBonusAfter = bonusCapability.calculateTotal(entity, 'melee_damage');
      
      console.log(`Melee attack bonus: ${meleeAttackBonusAfter}`);
      console.log(`Melee damage bonus: ${meleeDamageBonusAfter}`);
    } else {
      console.log('Power Attack plugin does not support removal');
    }
  }
  
  // Clean up
  console.log('\nShutting down plugin manager...');
  await pluginManager.shutdown();
  
  console.log('\n=== Migration Test Complete ===');
}

// Allow direct execution
if (require.main === module) {
  runMigrationTest().catch(console.error);
}