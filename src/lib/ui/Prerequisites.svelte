<script lang="ts">
  import type { AssembledCharacter } from '$lib/ui/types/CharacterTypes';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  // Props
  let { character } = $props<{
    character?: AssembledCharacter | null;
  }>();

  // Computed properties
  let prerequisites = $derived(getPrerequisites());
  let missingPrerequisites = $derived(getMissingPrerequisites());

  // Helper functions
  function getPrerequisites() {
    if (!character?.prerequisites) return [];
    return character.prerequisites.filter(p => p.fulfilled);
  }
  
  function getMissingPrerequisites() {
    if (!character?.prerequisites) return [];
    return character.prerequisites.filter(p => !p.fulfilled);
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Prerequisites</Card.Title>
    <Card.Description>
      Feature prerequisites and requirements
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if !character}
      <div class="rounded-md border border-muted p-4">
        <p class="text-muted-foreground">Loading prerequisites...</p>
      </div>
    {:else if prerequisites.length === 0 && missingPrerequisites.length === 0}
      <div class="rounded-md border border-muted p-4">
        <p class="text-muted-foreground">No prerequisites available.</p>
      </div>
    {:else}
      <div class="space-y-6">
        {#if prerequisites.length > 0}
          <div>
            <h3 class="text-lg font-semibold mb-2">Fulfilled Prerequisites</h3>
            <div class="grid gap-2">
              {#each prerequisites as prerequisite}
                <div class="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span class="text-sm">{prerequisite.description}</span>
                  <Badge variant="outline" class="bg-green-100 dark:bg-green-900">Met</Badge>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if missingPrerequisites.length > 0}
          <div>
            <h3 class="text-lg font-semibold mb-2">Missing Prerequisites</h3>
            <div class="grid gap-2">
              {#each missingPrerequisites as prerequisite}
                <div class="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span class="text-sm">{prerequisite.description}</span>
                  <Badge variant="outline" class="bg-red-100 dark:bg-red-900">Not Met</Badge>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </Card.Content>
</Card.Root>