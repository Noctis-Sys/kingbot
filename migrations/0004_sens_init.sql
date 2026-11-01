-- Seed the data for marvel rivals hero roster
INSERT INTO
	hero_roster (slug, name)
VALUES
	('angela', 'Angela'),
	('bruce_banner', 'Bruce Banner'),
	('captain_america', 'Captain America'),
	('devil_dinosaur', 'Devil Dinosaur'),
	('doctor_strange', 'Doctor Strange'),
	('emma_frost', 'Emma Frost'),
	('groot', 'Groot'),
	('magneto', 'Magneto'),
	('peni_parker', 'Peni Parker'),
	('rogue', 'Rogue'),
	('the_hood', 'The Hood'),
	('the_thing', 'The Thing'),
	('thor', 'Thor'),
	('venom', 'Venom'),
	('black_cat', 'Black Cat'),
	('black_panther', 'Black Panther'),
	('black_widow', 'Black Widow'),
	('blade', 'Blade'),
	('cyclops', 'Cyclops'),
	('daredevil', 'Daredevil'),
	('deadpool', 'Deadpool'),
	('elsa_bloodstone', 'Elsa Bloodstone'),
	('gorr_the_god_butcher', 'Gorr the God Butcher'),
	('hawkeye', 'Hawkeye'),
	('hela', 'Hela'),
	('human_torch', 'Human Torch'),
	('iron_fist', 'Iron Fist'),
	('iron_man', 'Iron Man'),
	('magik', 'Magik'),
	('mr_fantastic', 'Mr. Fantastic'),
	('moon_knight', 'Moon Knight'),
	('namor', 'Namor'),
	('phoenix', 'Phoenix'),
	('psylocke', 'Psylocke'),
	('scarlet_witch', 'Scarlet Witch'),
	('spider_man', 'Spider-Man'),
	('squirrel_girl', 'Squirrel Girl'),
	('star_lord', 'Star-Lord'),
	('storm', 'Storm'),
	('the_punisher', 'The Punisher'),
	('winter_soldier', 'Winter Soldier'),
	('wolverine', 'Wolverine'),
	('adam_warlock', 'Adam Warlock'),
	('cloak_dagger', 'Cloak & Dagger'),
	('gambit', 'Gambit'),
	('invisible_woman', 'Invisible Woman'),
	('jeff_the_land_shark', 'Jeff the Land Shark'),
	('jubilee', 'Jubilee'),
	('loki', 'Loki'),
	('luna_snow', 'Luna Snow'),
	('mantis', 'Mantis'),
	('rocket_raccoon', 'Rocket Raccoon'),
	('ultron', 'Ultron'),
	('white_fox', 'White Fox');

-- Seed the values for sens data known at this time
INSERT INTO
	sens_data (slug, type, x_axis, y_axis)
VALUES
	('magik', 'Controller', '295', '256'),
	('hela', 'Controller', '154', '114'),
	('psylocke', 'Controller', '256', '216'),
	('the_punisher', 'Controller', '256', '216'),
	('spider_man', 'Controller', '261', '301'),
	(
		'winter_soldier',
		'Mouse & Keyboard',
		'1.1',
		'1.1'
	),
	('daredevil', 'Mouse & Keyboard', '1.4', '1.4'),
	('deadpool', 'Mouse & Keyboard', '1.2', '1.2'),
	(
		'elsa_bloodstone',
		'Mouse & Keyboard',
		'2.30',
		'2.30'
	),
	('luna_snow', 'Mouse & Keyboard', '0.95', '0.95'),
	('magneto', 'Mouse & Keyboard', '1.2', '1.2'),
	('wolverine', 'Mouse & Keyboard', '2.0', '2.0'),
	('black_cat', 'Mouse & Keyboard', '1.4', '1.4'),
	('venom', 'Mouse & Keyboard', '1.2', '1.2');

-- The 'All Heros' profile, used as the default for heroes without a row in sens_data
INSERT INTO
	global_sens_data (type, x_axis, y_axis)
VALUES
	('Controller', '262', '212');
