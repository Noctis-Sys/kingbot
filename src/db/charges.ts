/**
 * Records one charge by the given user and returns the new global charge total.
 * Both writes run in one D1 batch, which is a transaction, so the per-user and global counts never drift apart.
 */
export async function recordCharge(db: D1Database, userId: string): Promise<number> {
	const [, total] = await db.batch<{ count: number }>([
		db
			.prepare('INSERT INTO user_charges (user_id, count) VALUES (?, 1) ON CONFLICT (user_id) DO UPDATE SET count = count + 1')
			.bind(userId),
		db.prepare(
			"INSERT INTO counters (name, count) VALUES ('charge', 1) ON CONFLICT (name) DO UPDATE SET count = count + 1 RETURNING count",
		),
	]);
	return total.results[0].count;
}

export interface ChargeLeaderboard {
	top: { user_id: string; count: number }[];
	total: number;
}

/**
 * The `limit` users with the most charges, highest first, plus the global charge total.
 */
export async function getChargeLeaderboard(db: D1Database, limit: number): Promise<ChargeLeaderboard> {
	const [top, total] = await db.batch([
		db.prepare('SELECT user_id, count FROM user_charges ORDER BY count DESC, user_id LIMIT ?').bind(limit),
		db.prepare("SELECT count FROM counters WHERE name = 'charge'"),
	]);
	return {
		top: top.results as ChargeLeaderboard['top'],
		total: (total.results[0] as { count: number } | undefined)?.count ?? 0,
	};
}
