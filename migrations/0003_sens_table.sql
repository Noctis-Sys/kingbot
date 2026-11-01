-- Create the table for storing sensitivity data
CREATE TABLE sens_data (
	slug TEXT NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('Controller', 'Mouse & Keyboard')),
	x_axis TEXT NOT NULL,
	y_axis TEXT NOT NULL,
	-- Unix seconds; NULL means the date of the last change is unknown
	updated_at INTEGER,
	PRIMARY KEY (slug, type),
	FOREIGN KEY (slug) REFERENCES hero_roster (slug) ON DELETE RESTRICT
);

-- Create a table for the global (All heroes) sens; used as a default for heroes with a missing profile
CREATE TABLE global_sens_data (
	type TEXT PRIMARY KEY NOT NULL CHECK (type IN ('Controller', 'Mouse & Keyboard')),
	x_axis TEXT NOT NULL,
	y_axis TEXT NOT NULL,
	-- Unix seconds; NULL means the date of the last change is unknown
	updated_at INTEGER
);
