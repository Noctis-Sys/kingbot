// "All Characters" isn't a hero_roster row; it maps to the global sens profile.
// `name` is what users see, `value` is what autocomplete submits (snake_case, like the roster slugs).
export const ALL_CHARACTERS = { name: 'All Characters', value: 'all_characters' } as const;

const NAME_LOWER = ALL_CHARACTERS.name.toLowerCase();

// Handler side: a picked suggestion arrives as the value, a free-typed entry as the name (any case).
export function isAllCharacters(query: string): boolean {
	const q = query.toLowerCase();
	return q === ALL_CHARACTERS.value || q === NAME_LOWER;
}

// Autocomplete side: whether the partially typed text should offer the "All Characters" suggestion.
export function suggestsAllCharacters(partial: string): boolean {
	const p = partial.toLowerCase();
	return NAME_LOWER.includes(p) || ALL_CHARACTERS.value.includes(p);
}
