// Database functions for accessing sens data.

export async function getRosterData(db: D1Database, search: string): Promise<RosterData> {
	const roster = await db
		.prepare(
			`SELECT slug, name FROM hero_roster WHERE name LIKE '%' || ?1 || '%' OR slug LIKE '%' || ?1 || '%' ORDER BY CASE WHEN name LIKE ?1 THEN 0 WHEN name LIKE ?1 || '%' THEN 1 WHEN name LIKE '% ' || ?1 || '%' THEN 2 WHEN name LIKE '%-' || ?1 || '%' THEN 2 ELSE 3 END, name ASC LIMIT 25`,
		)
		.bind(search)
		.all();
	return { characters: roster.results as RosterData['characters'] };
}

export interface RosterData {
	characters: { slug: string; name: string }[];
}

export interface SensProfile {
	profile: {
		slug: string;
		type: string;
		x_axis: number;
		y_axis: number;
		updated_at: string;
	};
}
