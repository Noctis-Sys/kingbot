-- Create the table for storing sensitivity data
CREATE TABLE sens_data (
	slug TEXT PRIMARY KEY NOT NULL,
	display_name TEXT NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('Controller', 'Mouse & Keyboard')),
	x_axis TEXT NOT NULL,
	y_axis TEXT NOT NULL
);
