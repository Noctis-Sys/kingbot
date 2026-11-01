-- Create the table for storing sensitivity data
PRAGMA foreign_keys = ON
CREATE TABLE sens_data (
	slug TEXT PRIMARY KEY NOT NULL,
	FOREIGN KEY (slug) REFERENCES hero_roster(slug) ON DELETE RESTRICT
	type TEXT NOT NULL CHECK (type IN ('Controller', 'Mouse & Keyboard')),
	x_axis TEXT NOT NULL,
	y_axis TEXT NOT NULL
);
