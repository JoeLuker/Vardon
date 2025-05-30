<script lang="ts">
  import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  // Props
  let { character } = $props<{
    character?: AssembledCharacter | null;
  }>();

  // Computed properties
  let weapons = $derived(getWeapons());
  let armor = $derived(getArmor());

  // Helper functions
  function getWeapons() {
    if (!character?.game_character_weapon) return [];
    return character.game_character_weapon;
  }
  
  function getArmor() {
    if (!character?.game_character_armor) return [];
    return character.game_character_armor;
  }
  
  function getEnhancementString(enhancement: number, masterwork: boolean) {
    if (enhancement <= 0 && !masterwork) return '';
    if (enhancement <= 0 && masterwork) return 'Masterwork';
    return `+${enhancement}${masterwork ? ' Masterwork' : ''}`;
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Weapon & Armor Enhancements</Card.Title>
    <Card.Description>
      Magical and masterwork equipment
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if weapons.length === 0 && armor.length === 0}
      <div class="rounded-md border border-muted p-4">
        <p class="text-muted-foreground">No enhanced equipment found.</p>
      </div>
    {:else}
      <div class="space-y-6">
        {#if weapons.length > 0}
          <div>
            <h3 class="text-lg font-semibold mb-2">Weapons</h3>
            <div class="grid gap-2">
              {#each weapons as weapon}
                {#if weapon.enhancement > 0 || weapon.masterwork}
                  <div class="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span>{weapon.weapon?.label || weapon.weapon?.name}</span>
                    <Badge variant="outline">{getEnhancementString(weapon.enhancement, weapon.masterwork)}</Badge>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
        
        {#if armor.length > 0}
          <div>
            <h3 class="text-lg font-semibold mb-2">Armor</h3>
            <div class="grid gap-2">
              {#each armor as armorItem}
                <div class="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span>{armorItem.armor?.label || armorItem.armor?.name}</span>
                  {#if armorItem.enhancement > 0}
                    <Badge variant="outline">+{armorItem.enhancement}</Badge>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </Card.Content>
</Card.Root>