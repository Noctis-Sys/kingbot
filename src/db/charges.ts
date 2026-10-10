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
