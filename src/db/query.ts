// Database functions for accessing sens data.
import { ALL_CHARACTERS } from '../util/allCharacters';

export async function getRosterData(db: D1Database, search: string): Promise<RosterEntry[]> {
	const { results } = await db
		.prepare(
			`SELECT slug, name 
                FROM hero_roster 
                WHERE name LIKE '%' || ?1 || '%' OR slug LIKE '%' || ?1 || '%' 
                ORDER BY 
                    CASE 
                        WHEN name LIKE ?1 THEN 0 
                        WHEN name LIKE ?1 || '%' THEN 1 
                        WHEN name LIKE '% ' || ?1 || '%' THEN 2 
                        WHEN name LIKE '%-' || ?1 || '%' THEN 2 
                        ELSE 3 
                    END, 
                    name ASC 
                    LIMIT 25`,
		)
		.bind(search)
		.all<RosterEntry>();
	return results;
}

// `search` is a slug when a suggestion was picked, or a typed character name (any case) when it wasn't.
export async function getSensProfile(db: D1Database, search: string): Promise<SensProfile[]> {
	const { results } = await db
		.prepare(
			`SELECT r.name, r.slug, s.type, s.x_axis, s.y_axis, s.dpi, s.updated_at
             FROM hero_roster r 
             LEFT JOIN sens_data s ON s.slug = r.slug 
             WHERE r.slug = ?1 OR r.name = ?1 COLLATE NOCASE
             ORDER BY s.type ASC`,
		)
		.bind(search)
		.all<SensProfile>();
	return results;
}

export async function getGlobalSensProfile(db: D1Database): Promise<SensProfile[]> {
	const { results } = await db
		.prepare(
			`SELECT ?1 as name, ?2 as slug, type, x_axis, y_axis, dpi, updated_at
                FROM global_sens_data
                ORDER BY type
            `,
		)
		.bind(ALL_CHARACTERS.name, ALL_CHARACTERS.value)
		.all<SensProfile>();
	return results;
}

export interface RosterEntry {
	slug: string;
	name: string;
}

export interface SensProfile {
	name: string;
	type: string | null;
	slug: string | null;
	x_axis: string | null;
	y_axis: string | null;
	// Only ever set on Mouse & Keyboard rows; NULL when unknown.
	dpi: number | null;
	updated_at: number | null;
}
