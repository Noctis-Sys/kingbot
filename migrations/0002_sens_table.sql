-- Create the table for storing sensitivity data
CREATE TABLE sens_data (
	slug TEXT PRIMARY KEY,
	display_name TEXT,
	type TEXT NOT NULL CHECK (type IN ('Controller', 'Mouse & Keyboard')),
	x_axis TEXT NOT NULL,
	y_axis TEXT NOT NULL
);
