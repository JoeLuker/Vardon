<script lang="ts">
    
    export let node: {
        name: string;
        id: string | number;
        level: number;
        isActive: boolean;
        isAvailable: boolean;
        isLast: boolean;
        path: string;
        children: any[];
    };
</script>

<div class="tree-node">
    <div class="node-content flex items-center" 
         class:font-medium={node.isActive}
         class:opacity-60={!node.isAvailable}>
        <span class="node-connector" class:last={node.isLast}></span>
        <div class="node-label py-1 px-2 rounded text-sm"
             class:bg-success-10={node.isActive}
             class:text-success={node.isActive}>
            {node.name} 
            <span class="text-muted-foreground text-xs">(ML {node.level})</span>
        </div>
    </div>
    
    {#if node.children.length > 0}
        <div class="node-children pl-6 ml-2 border-l">
            {#each node.children as child}
                <svelte:self node={child} />
            {/each}
        </div>
    {/if}
</div>

<style lang="postcss">
    .node-connector {
        position: relative;
        width: 18px;
        height: 1px;
        display: inline-block;
    }
    
    .node-connector:before {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        width: 12px;
        height: 1px;
        background-color: theme('colors.border');
    }
    
    .node-connector:after {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        height: 100%;
        width: 1px;
        background-color: theme('colors.border');
    }
    
    .node-connector.last:after {
        display: none;
    }
    
    .node-children {
        position: relative;
    }
    
    .bg-success-10 {
        background-color: rgba(var(--success), 0.1);
    }
</style> 