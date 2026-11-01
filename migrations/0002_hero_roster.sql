-- Create the table for storing hero roster data; used to validate keys in sens_data table
CREATE TABLE hero_roster (
	slug TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL UNIQUE
);
