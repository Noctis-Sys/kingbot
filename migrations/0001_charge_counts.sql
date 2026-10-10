-- Running totals, one row per counter (e.g. 'charge'). Kept separately from
-- user_charges so the global total is a single-row read, not a SUM over every user.
CREATE TABLE counters (
	name TEXT PRIMARY KEY,
	count INTEGER NOT NULL DEFAULT 0
);

-- Charges per Discord user, across every server and DM.
CREATE TABLE user_charges (
	user_id TEXT PRIMARY KEY,
	count INTEGER NOT NULL DEFAULT 0
);
