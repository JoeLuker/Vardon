<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Self from './TreeNode.svelte';

	const { node, onNodeclick } = $props<{
		node: {
			name: string;
			id: number | string;
			level: number;
			isActive: boolean;
			isAvailable: boolean;
			isLast: boolean;
			path: string;
			entry?: any;
			children: any[];
		};
		onNodeclick?: (entry: any) => void;
	}>();

	function handleClick() {
		if (node.entry && onNodeclick) {
			onNodeclick(node.entry);
		}
	}
</script>

<div class="tree-node py-1">
	<div class="node-content flex items-center">
		<span class="node-connector" class:last={node.isLast}></span>

		<!-- Make the label clickable if there's an entry using shadcn Button -->
		<Button
			variant={node.isActive ? 'outline' : 'ghost'}
			size="sm"
			class={`h-auto min-w-[180px] justify-start gap-1.5 whitespace-nowrap px-3 py-2 text-left ${node.isActive ? 'border-success text-success font-medium' : ''} ${!node.isAvailable ? 'opacity-60' : ''}`}
			disabled={!node.entry || !node.isAvailable}
			onclick={handleClick}
		>
			<span>{node.name}</span>
			<span class="ml-1 text-xs text-muted-foreground">(ML {node.level})</span>
		</Button>
	</div>

	{#if node.children && node.children.length > 0}
		<div class="node-children ml-2 mt-2 border-l pl-8">
			{#each node.children as child}
				<Self node={child} {onNodeclick} />
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	.tree-node {
		margin-bottom: 0.25rem;
	}

	.node-connector {
		position: relative;
		width: 24px;
		height: 1px;
		display: inline-block;
	}

	.node-connector:before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		width: 16px;
		height: 1px;
		background-color: theme('colors.border');
	}

	.node-connector:after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		height: 150%;
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
