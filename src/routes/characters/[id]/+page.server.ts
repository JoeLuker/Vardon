// FILE: src/routes/characters/[id]/+page.ts
export function load({ params }) {
	// e.g. the route is /characters/[id]? then params.id is that path segment
	const numericId = Number(params.id);

	return {
		id: numericId
	};
}
