<script lang="ts">
    import type { EnrichedCharacter } from '$lib/domain/characterCalculations';    
    import * as Card from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Tabs from '$lib/components/ui/tabs';
    import TreeNode from '$lib/components/TreeNode.svelte';
    
    let { character } = $props<{ character: EnrichedCharacter }>();
    
    // Helper function to safely access manifestation
    function getManifestationFromEntry(entry: any): any {
        return entry.manifestation;
    }
    
    // Function to check if a manifestation is available at the current manifestation level
    function isManifestationAvailable(manifestation: any, currentLevel: number): boolean {
        return manifestation?.min_manifestation_level <= currentLevel;
    }
    
    // Format description text with Gift and Stain sections and extract mechanical details
    function formatDescription(description: string | null): { 
        gift: string, 
        stain: string,
        mechanics: {
            action?: string,
            duration?: string,
            uses?: string,
            save_dc?: string
        },
        level_progression: { level: number, effect: string }[],
        affects_blood_consumption: boolean
    } {
        if (!description) return { 
            gift: '', 
            stain: '', 
            mechanics: {}, 
            level_progression: [],
            affects_blood_consumption: false
        };
        
        const giftMatch = description.match(/Gift:(.*?)(?=Stain:|$)/s);
        const stainMatch = description.match(/Stain:(.*?)$/s);
        
        const gift = giftMatch ? giftMatch[1].trim() : '';
        const stain = stainMatch ? stainMatch[1].trim() : '';
        
        // Extract mechanics information
        const mechanics: {
            action?: string,
            duration?: string,
            uses?: string,
            save_dc?: string
        } = {};
        
        // Action type
        const actionMatch = gift.match(/\b(swift|immediate|move|standard|full-round|free) action\b/i);
        if (actionMatch) {
            mechanics.action = actionMatch[0];
        }
        
        // Duration
        const durationMatch = gift.match(/\b(\d+)\s+(round|minute|hour|day)s?\b/i);
        if (durationMatch) {
            mechanics.duration = durationMatch[0];
        } else if (gift.match(/\bat will\b/i)) {
            mechanics.duration = 'At will';
        }
        
        // Uses per day/week
        const usesMatch = gift.match(/\b(\d+)(?:\/|\s+per\s+)(day|week)\b/i) || 
                          gift.match(/\bonce per (day|week)\b/i) ||
                          gift.match(/\b(\d+) times? per (day|week)\b/i);
        if (usesMatch) {
            mechanics.uses = usesMatch[0];
        }
        
        // Save DC
        const saveDcMatch = gift.match(/\bDC\s+(\d+)\b/i) || stain.match(/\bDC\s+(\d+)\b/i);
        if (saveDcMatch) {
            mechanics.save_dc = saveDcMatch[0];
        }
        
        // Extract level progression information
        const levelProgressions: { level: number, effect: string }[] = [];
        
        // Look for patterns like "at manifestation level X" or "at ML X"
        const mlRegex = /\bat (?:manifestation level|ML) (\d+)[^\.\,]*[^\.]*/gi;
        let mlMatch;
        while ((mlMatch = mlRegex.exec(gift)) !== null) {
            const level = parseInt(mlMatch[1]);
            const effect = mlMatch[0].trim();
            levelProgressions.push({ level, effect });
        }
        
        // Also check for patterns like "+2 (or +4 at ML 3)"
        const parensMLRegex = /\(\s*or\s+([^\)]*?(?:at (?:manifestation level|ML) (\d+))[^\)]*)\)/gi;
        let parensMatch;
        while ((parensMatch = parensMLRegex.exec(gift)) !== null) {
            const level = parseInt(parensMatch[2]);
            const effect = parensMatch[1].trim();
            levelProgressions.push({ level, effect });
        }
        
        // Check if this manifestation affects blood consumption
        const affectsBloodConsumption = stain.includes('blood') && 
            (stain.includes('day') || stain.includes('week') || stain.includes('consume'));
        
        return {
            gift,
            stain,
            mechanics,
            level_progression: levelProgressions,
            affects_blood_consumption: affectsBloodConsumption
        };
    }
    
    // Process the data without using complex derived state
    function getCorruptionData() {
        const corruptions = character?.game_character_corruption || [];
        const manifestations = character?.game_character_corruption_manifestation || [];
        
        return corruptions.map((corruption: any) => {
            const corruptionInfo = corruption.corruption;
            const corruptionManifestations = manifestations.filter(
                (m: any) => {
                    // Access the corruption_id through a type-safe approach
                    const manifestationObj = m as unknown as { manifestation: { corruption_id: number } };
                    return manifestationObj.manifestation?.corruption_id === corruptionInfo.id;
                }
            );
            
            return {
                corruption: corruptionInfo,
                manifestations: corruptionManifestations
            };
        });
    }
    
    let corruptionData = $derived(getCorruptionData());
    let selectedManifestationDetail = $state<{
        name: string;
        label: string;
        description: string;
        gift: string;
        stain: string;
        active: boolean;
        min_level: number;
        prerequisite?: string;
        prerequisites?: { name: string }[];
        level_progression?: { level: number; effect: string }[];
        mechanics?: { action?: string; duration?: string; uses?: string; save_dc?: string };
        affects_blood_consumption?: boolean;
    } | null>(null);
    let dialogOpen = $state(false);
    
    function showManifestationDetail(manifestationEntry: any) {
        const manifestation = getManifestationFromEntry(manifestationEntry);
        const descriptionParts = formatDescription(manifestation?.description);
        
        // Get prerequisite information (primary or first from array)
        let prerequisiteName = '';
        const prerequisites: { name: string }[] = [];
        
        if (manifestation?.prerequisites && manifestation.prerequisites.length > 0) {
            // Process all prerequisites
            manifestation.prerequisites.forEach((prereq: {
                prerequisite_manifestation_id: number;
                prerequisite?: { label?: string; name?: string; }
            }) => {
                if (prereq.prerequisite) {
                    const name = prereq.prerequisite.label || prereq.prerequisite.name || `ID:${prereq.prerequisite_manifestation_id}`;
                    prerequisites.push({ name });
                    
                    // Set the first one as the primary prerequisite
                    if (!prerequisiteName) {
                        prerequisiteName = name;
                    }
                }
            });
        } else if (manifestation?.prerequisite) {
            prerequisiteName = manifestation.prerequisite.label || manifestation.prerequisite.name;
            prerequisites.push({ name: prerequisiteName });
        }
        
        selectedManifestationDetail = {
            name: manifestation?.name || '',
            label: manifestation?.label || manifestation?.name || 'Unknown Manifestation',
            description: manifestation?.description || '',
            gift: descriptionParts.gift,
            stain: descriptionParts.stain,
            active: manifestationEntry.active,
            min_level: manifestation?.min_manifestation_level || 1,
            prerequisite: prerequisiteName,
            prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
            level_progression: descriptionParts.level_progression,
            mechanics: descriptionParts.mechanics,
            affects_blood_consumption: descriptionParts.affects_blood_consumption
        };
        
        dialogOpen = true;
    }
    
    // Define the type for a node in our tree
    type ManifestationNode = {
        entry: any;
        manifestation: {
            name: string;
            label?: string;
            id: string | number;
            min_manifestation_level: number;
            prerequisite_manifestation_id?: number;
            prerequisite?: {
                id: number;
                name: string;
                label?: string;
            };
            [key: string]: any;
        };
        children: ManifestationNode[];
    };
    
    // Define a type for the tree node that gets passed to the TreeNode component
    type TreeNodeData = {
        name: string;
        id: string | number;
        level: number;
        isActive: boolean;
        isAvailable: boolean;
        isLast: boolean;
        path: string;
        children: TreeNodeData[];
    };
    
    // Function to build a prerequisite tree for manifestations
    function buildPrerequisiteTree(manifestations: any[]) {
        // First, create a map of manifestation id to entry
        const manifestationMap = manifestations.reduce((map, entry) => {
            const manifestation = getManifestationFromEntry(entry);
            if (manifestation && manifestation.id) {
                map[manifestation.id] = {
                    entry,
                    manifestation,
                    children: []
                };
            }
            return map;
        }, {} as Record<string | number, ManifestationNode>);
        
        // Now build the tree structure
        const rootNodes: ManifestationNode[] = [];
        
        // For debugging - count relations found
        let relationsFound = 0;
        
        // Connect children to parents
        (Object.values(manifestationMap) as ManifestationNode[]).forEach((node) => {
            // Try multiple ways to find prerequisite relationships
            const prerequisiteId = node.manifestation.prerequisite?.id || 
                                   node.manifestation.prerequisite_manifestation_id;
            
            // Also check for prerequisites array (from the new relationship table)
            const prerequisites = node.manifestation.prerequisites || [];
            
            if (prerequisiteId) {
                // Make sure the prerequisite exists in our map
                if (manifestationMap[prerequisiteId]) {
                    // This has a parent, add it to parent's children
                    manifestationMap[prerequisiteId].children.push(node);
                    relationsFound++;
                } else {
                    // Prerequisite ID exists but not found in our map
                    rootNodes.push(node);
                }
            } else if (prerequisites.length > 0) {
                // Handle prerequisites from the relationship table
                // For tree view, we'll use the first prerequisite as the parent
                const firstPrereq = prerequisites[0];
                const prerequisiteId = firstPrereq.prerequisite_manifestation_id;
                
                if (prerequisiteId && manifestationMap[prerequisiteId]) {
                    manifestationMap[prerequisiteId].children.push(node);
                    relationsFound++;
                } else {
                    rootNodes.push(node);
                }
            } else {
                // No prerequisite identified, it's a root
                rootNodes.push(node);
            }
        });
        
        // If no relationships were found but we have multiple manifestations,
        // we'll try to extract relationships from descriptions or other fields
        if (relationsFound === 0 && Object.keys(manifestationMap).length > 1) {
            // This would be a place to implement alternative relationship detection
            // For example, parsing text descriptions for mentions of other manifestations
            // or using min_manifestation_level to create a progression tree
            
            // For now, we'll create a simple level-based tree if no explicit relations exist
            const nodesByLevel = {} as Record<number, ManifestationNode[]>;
            
            // Clear root nodes first since we're rebuilding the tree
            rootNodes.length = 0;
            
            // Group nodes by manifestation level
            (Object.values(manifestationMap) as ManifestationNode[]).forEach(node => {
                const level = node.manifestation.min_manifestation_level || 1;
                if (!nodesByLevel[level]) {
                    nodesByLevel[level] = [];
                }
                nodesByLevel[level].push(node);
                
                // Reset children since we're rebuilding the tree
                node.children = [];
            });
            
            // Get sorted levels
            const levels = Object.keys(nodesByLevel)
                .map(Number)
                .sort((a, b) => a - b);
            
            // Add lowest level nodes as roots
            if (levels.length > 0) {
                nodesByLevel[levels[0]].forEach(node => {
                    rootNodes.push(node);
                });
                
                // For each higher level, attach to a node from the previous level
                for (let i = 1; i < levels.length; i++) {
                    const previousLevelNodes = nodesByLevel[levels[i-1]];
                    const currentLevelNodes = nodesByLevel[levels[i]];
                    
                    // If we have previous level nodes, attach current nodes as children
                    // Otherwise add them as roots
                    if (previousLevelNodes.length > 0) {
                        // Find the best parent based on name similarity or other criteria
                        // For simplicity, we'll just attach to the first previous level node
                        currentLevelNodes.forEach(node => {
                            previousLevelNodes[0].children.push(node);
                        });
                    } else {
                        currentLevelNodes.forEach(node => {
                            rootNodes.push(node);
                        });
                    }
                }
            }
        }
        
        // Sort root nodes by min_manifestation_level
        rootNodes.sort((a, b) => 
            (a.manifestation.min_manifestation_level || 1) - 
            (b.manifestation.min_manifestation_level || 1)
        );
        
        // Sort children by min_manifestation_level for each node
        const sortNodeChildren = (node: ManifestationNode) => {
            if (node.children.length > 0) {
                node.children.sort((a, b) => 
                    (a.manifestation.min_manifestation_level || 1) - 
                    (b.manifestation.min_manifestation_level || 1)
                );
                node.children.forEach(sortNodeChildren);
            }
        };
        
        rootNodes.forEach(sortNodeChildren);
        
        return { rootNodes };
    }
    
    // Recursive function to render a tree node
    function renderTreeNode(node: ManifestationNode, manifestationLevel: number, isLast: boolean, path: string): TreeNodeData {
        const manifestation = node.manifestation;
        const isActive = node.entry.active;
        const isAvailable = isManifestationAvailable(manifestation, manifestationLevel);
        
        return {
            name: manifestation.label || manifestation.name,
            id: manifestation.id,
            level: manifestation.min_manifestation_level,
            isActive,
            isAvailable,
            isLast,
            path,
            children: node.children.map((child: ManifestationNode, i: number) => 
                renderTreeNode(
                    child, 
                    manifestationLevel,
                    i === node.children.length - 1,
                    `${path}-${i}`
                )
            )
        };
    }
    
    // Get prerequisite tree data for a corruption
    function getPrerequisiteTreeData(corruption: any, manifestations: any[]): { 
        nodes: TreeNodeData[], 
        isFallbackTree: boolean
    } {
        const { rootNodes } = buildPrerequisiteTree(manifestations);
        
        // Check if this is a fallback tree - updated to check prerequisites array
        const isFallbackTree = manifestations.length > 1 && 
            !manifestations.some(entry => {
                const manifestation = getManifestationFromEntry(entry);
                return manifestation && (
                    manifestation.prerequisite?.id || 
                    (manifestation.prerequisites && manifestation.prerequisites.length > 0)
                );
            });
        
        const nodes = rootNodes.map((node, i) => 
            renderTreeNode(
                node, 
                corruption.manifestation_level || 0, 
                i === rootNodes.length - 1,
                `${i}`
            )
        );
        
        return { nodes, isFallbackTree };
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Corruptions</Card.Title>
        <Card.Description>
            Corruptions and their manifestations that affect your character
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if !character}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">Loading corruptions...</p>
            </div>
        {:else if corruptionData.length === 0}
            <div class="rounded-md border border-muted p-4">
                <p class="text-muted-foreground">This character has no corruptions.</p>
            </div>
        {:else}
            <ScrollArea class="h-[calc(100vh-30rem)] min-h-[300px] max-h-[600px] pr-4">
                <div class="space-y-6">
                    {#each corruptionData as { corruption, manifestations }}
                        <div class="corruption-group">
                            <div class="flex items-center justify-between gap-4 mb-3">
                                <h3 class="text-base sm:text-lg font-semibold">
                                    {corruption.label || corruption.name}
                                </h3>
                                <div class="flex gap-2">
                                    <Badge variant="outline">Stage: {corruption.corruption_stage || 0}</Badge>
                                    <Badge>Level: {corruption.manifestation_level || 0}</Badge>
                                </div>
                            </div>
                            
                            {#if corruption.description}
                                <p class="text-sm text-muted-foreground mb-3">{corruption.description}</p>
                            {/if}
                            
                            {#if manifestations.length > 0}
                                <Tabs.Root value="cards" class="mb-4">
                                    <Tabs.List>
                                        <Tabs.Trigger value="cards">Card View</Tabs.Trigger>
                                        <Tabs.Trigger value="tree">Prerequisite Tree</Tabs.Trigger>
                                    </Tabs.List>
                                    <Tabs.Content value="cards">
                                        <div class="grid gap-2 sm:gap-3 sm:grid-cols-1 md:grid-cols-2 mt-4">
                                            {#each manifestations as manifestationEntry}
                                                {@const manifestation = getManifestationFromEntry(manifestationEntry)}
                                                {@const descriptionParts = formatDescription(manifestation?.description)}
                                                {@const available = isManifestationAvailable(manifestation, corruption.manifestation_level || 0)}
                                                
                                                <button 
                                                    class="w-full text-left group"
                                                    onclick={() => showManifestationDetail(manifestationEntry)}
                                                >
                                                    <div class="rounded-lg border p-3 space-y-2 hover:bg-muted/50 transition-colors relative overflow-hidden"
                                                        class:border-l-success={manifestationEntry.active}
                                                        class:border-l-4={manifestationEntry.active}
                                                        class:opacity-70={!available}>
                                                        
                                                        <div class="flex flex-wrap gap-2 items-center">
                                                            <h4 class="text-sm font-medium">
                                                                {manifestation?.label || manifestation?.name || 'Unknown Manifestation'}
                                                            </h4>
                                                            
                                                            <div class="flex gap-1 flex-wrap">
                                                                <Badge variant="outline" class="text-xs">
                                                                    Min Level: {manifestation?.min_manifestation_level || 1}
                                                                </Badge>
                                                                
                                                                {#if !manifestationEntry.active}
                                                                    <Badge variant="secondary" class="text-xs">Inactive</Badge>
                                                                {:else}
                                                                    <Badge variant="default" class="text-xs">Active</Badge>
                                                                {/if}
                                                                
                                                                {#if manifestation?.prerequisite_manifestation_id}
                                                                    <Badge variant="outline" class="text-xs bg-amber-100 dark:bg-amber-950">
                                                                        Req: {manifestation?.prerequisite?.label || 
                                                                              manifestation?.prerequisite?.name || 
                                                                              'Unknown Prerequisite'}
                                                                    </Badge>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                        
                                                        {#if manifestation?.prerequisite_manifestation_id && !available}
                                                            <div class="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                                Requires: {manifestation?.prerequisite?.label || 
                                                                          manifestation?.prerequisite?.name || 
                                                                          'Unknown Prerequisite'}
                                                            </div>
                                                        {/if}
                                                        
                                                        {#if descriptionParts.gift || descriptionParts.stain}
                                                            <div class="text-xs text-muted-foreground">
                                                                {#if descriptionParts.gift}
                                                                    <div class="line-clamp-2">
                                                                        <span class="text-success font-medium">Gift:</span> {descriptionParts.gift}
                                                                    </div>
                                                                {/if}
                                                                {#if descriptionParts.gift && descriptionParts.stain}
                                                                    <div class="my-1"></div>
                                                                {/if}
                                                                {#if descriptionParts.stain}
                                                                    <div class="line-clamp-2">
                                                                        <span class="text-destructive font-medium">Stain:</span> {descriptionParts.stain}
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                </button>
                                            {/each}
                                        </div>
                                    </Tabs.Content>
                                    <Tabs.Content value="tree" class="mt-4">
                                        <div class="pl-5 pr-3 py-3 border rounded-md bg-background">
                                            <!-- Tree Visualization -->
                                            {#if manifestations.length > 0}
                                                {@const treeResult = getPrerequisiteTreeData(corruption, manifestations)}
                                                {#if treeResult.nodes.length > 0}
                                                    {#if treeResult.isFallbackTree}
                                                        <div class="text-amber-600 dark:text-amber-400 text-xs mb-3 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800">
                                                            No direct prerequisite relationships found. Showing a suggested progression based on manifestation levels.
                                                        </div>
                                                    {/if}
                                                    <div class="tree-view font-sans">
                                                        {#each treeResult.nodes as nodeData}
                                                            <TreeNode node={nodeData} />
                                                        {/each}
                                                    </div>
                                                {:else}
                                                    <p class="text-muted-foreground text-center text-sm">
                                                        No prerequisite relationships found. 
                                                        This may be because manifestations don't have prerequisite_manifestation_id or prerequisite object set.
                                                    </p>
                                                    <div class="mt-3 text-xs border-t pt-2">
                                                        <p class="font-medium text-muted-foreground">Manifestation Data:</p>
                                                        <ul class="mt-1 space-y-1 text-muted-foreground">
                                                            {#each manifestations as manifestationEntry}
                                                                {@const manifestation = getManifestationFromEntry(manifestationEntry)}
                                                                {#if manifestation}
                                                                    <li>
                                                                        <span class="font-medium">{manifestation.label || manifestation.name}</span>
                                                                        {#if manifestation.prerequisites && manifestation.prerequisites.length > 0}
                                                                            <span class="text-emerald-600 dark:text-emerald-400"> - 
                                                                                Has {manifestation.prerequisites.length} prerequisite(s): 
                                                                                {manifestation.prerequisites.map((p: {
                                                                                    prerequisite_manifestation_id: number;
                                                                                    prerequisite?: { label?: string; name?: string; }
                                                                                }) => 
                                                                                    p.prerequisite?.label || p.prerequisite?.name || `ID:${p.prerequisite_manifestation_id}`
                                                                                ).join(', ')}
                                                                            </span>
                                                                        {:else if manifestation.prerequisite}
                                                                            <span class="text-emerald-600 dark:text-emerald-400"> - 
                                                                                Has prerequisite: {manifestation.prerequisite.label || manifestation.prerequisite.name}
                                                                            </span>
                                                                        {:else}
                                                                            <span class="text-amber-600 dark:text-amber-400"> - No prerequisite</span>
                                                                        {/if}
                                                                    </li>
                                                                {/if}
                                                            {/each}
                                                        </ul>
                                                    </div>
                                                {/if}
                                            {/if}
                                        </div>
                                    </Tabs.Content>
                                </Tabs.Root>
                            {:else}
                                <div class="rounded-md border border-muted p-4">
                                    <p class="text-muted-foreground text-center text-sm">No manifestations selected.</p>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </ScrollArea>
        {/if}
    </Card.Content>
</Card.Root>

<!-- Manifestation Detail Dialog -->
<Dialog.Root bind:open={dialogOpen}>
    <Dialog.Portal>
        <Dialog.Overlay class="animate-in fade-in-0" />
        <Dialog.Content 
            class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-lg rounded-lg border bg-background shadow-lg overflow-hidden"
        >
            {#if selectedManifestationDetail}
                <Dialog.Header class="border-b bg-background p-6">
                    <Dialog.Title class="text-xl font-semibold leading-none">
                        {selectedManifestationDetail.label}
                        {#if selectedManifestationDetail.active}
                            <Badge variant="default" class="ml-2">Active</Badge>
                        {:else}
                            <Badge variant="secondary" class="ml-2">Inactive</Badge>
                        {/if}
                    </Dialog.Title>
                    <Dialog.Description class="mt-2 flex flex-wrap gap-2 items-center">
                        <Badge variant="outline">Minimum Level: {selectedManifestationDetail.min_level}</Badge>
                        
                        {#if selectedManifestationDetail.prerequisites && selectedManifestationDetail.prerequisites.length > 1}
                            <Badge variant="outline" class="bg-amber-100 dark:bg-amber-950">
                                Requires: {selectedManifestationDetail.prerequisites.map(p => p.name).join(', ')}
                            </Badge>
                        {:else if selectedManifestationDetail.prerequisite}
                            <Badge variant="outline" class="bg-amber-100 dark:bg-amber-950">
                                Requires: {selectedManifestationDetail.prerequisite}
                            </Badge>
                        {/if}
                    </Dialog.Description>
                </Dialog.Header>

                <div class="p-6 overflow-y-auto max-h-[60vh]">
                    <div class="prose prose-sm dark:prose-invert max-w-none space-y-4">
                        {#if selectedManifestationDetail.gift}
                            <div>
                                <h3 class="text-success text-base font-medium">Gift</h3>
                                <div class="whitespace-pre-wrap">
                                    <p>{selectedManifestationDetail.gift}</p>
                                    
                                    {#if selectedManifestationDetail.level_progression && selectedManifestationDetail.level_progression.length > 0}
                                        <div class="mt-3 border-t border-muted pt-2">
                                            <h4 class="text-sm font-medium">Level Progression</h4>
                                            <ul class="mt-1 space-y-1">
                                                {#each selectedManifestationDetail.level_progression as progression}
                                                    <li class="flex gap-2">
                                                        <span class="font-medium">Level {progression.level}:</span> 
                                                        <span>{progression.effect}</span>
                                                    </li>
                                                {/each}
                                            </ul>
                                        </div>
                                    {/if}
                                    
                                    {#if selectedManifestationDetail.mechanics}
                                        <div class="mt-3 border-t border-muted pt-2">
                                            <h4 class="text-sm font-medium">Mechanics</h4>
                                            <dl class="mt-1 grid grid-cols-[120px_1fr] gap-x-2 gap-y-1 text-sm">
                                                {#if selectedManifestationDetail.mechanics.action}
                                                    <dt class="font-medium">Action:</dt>
                                                    <dd>{selectedManifestationDetail.mechanics.action}</dd>
                                                {/if}
                                                {#if selectedManifestationDetail.mechanics.duration}
                                                    <dt class="font-medium">Duration:</dt>
                                                    <dd>{selectedManifestationDetail.mechanics.duration}</dd>
                                                {/if}
                                                {#if selectedManifestationDetail.mechanics.uses}
                                                    <dt class="font-medium">Uses:</dt>
                                                    <dd>{selectedManifestationDetail.mechanics.uses}</dd>
                                                {/if}
                                                {#if selectedManifestationDetail.mechanics.save_dc}
                                                    <dt class="font-medium">Save DC:</dt>
                                                    <dd>{selectedManifestationDetail.mechanics.save_dc}</dd>
                                                {/if}
                                            </dl>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                        
                        {#if selectedManifestationDetail.stain}
                            <div>
                                <h3 class="text-destructive text-base font-medium">Stain</h3>
                                <p class="whitespace-pre-wrap">{selectedManifestationDetail.stain}</p>
                                
                                {#if selectedManifestationDetail.affects_blood_consumption}
                                    <div class="mt-3 bg-red-50 dark:bg-red-950/40 p-2 rounded-md border border-red-200 dark:border-red-800 text-sm">
                                        <span class="font-medium">Note:</span> This manifestation affects your blood consumption requirements.
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="border-t bg-background p-4">
                    <Dialog.Close class="w-full h-10 inline-flex items-center justify-center rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90">
                        Close
                    </Dialog.Close>
                </div>
            {/if}
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<style lang="postcss">
    /* Using Tailwind CSS classes for styling */
</style>