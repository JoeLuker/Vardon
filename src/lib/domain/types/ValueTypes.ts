/**
 * Modifier with source
 */
export interface ValueModifier {
	source: string;
	value: number;
	priority?: number;
	type?: string;
}

/**
 * Value with breakdown of modifiers
 */
export interface ValueWithBreakdown {
	total: number;
	modifiers: ValueModifier[];
	base?: number;
}
