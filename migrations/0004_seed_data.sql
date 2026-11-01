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

-- Seed the values for sens data known at this time.
-- updated_at comes from each Nightbot command's last edit; NULL where no date is recoverable.
INSERT INTO
	sens_data (slug, type, x_axis, y_axis, updated_at)
VALUES
	-- Controller
	('hela', 'Controller', '154', '114', NULL), -- old value, no longer on Nightbot
	(
		'iron_fist',
		'Controller',
		'320',
		'280',
		1789161198
	), -- 2026-09-11
	('magik', 'Controller', '295', '256', 1748233196), -- 2025-05-26
	(
		'psylocke',
		'Controller',
		'256',
		'216',
		1761969472
	), -- 2025-11-01
	(
		'spider_man',
		'Controller',
		'261',
		'301',
		1748233239
	), -- 2025-05-26
	('the_punisher', 'Controller', '256', '216', NULL), -- old value, no longer on Nightbot
	-- Mouse & Keyboard
	(
		'black_cat',
		'Mouse & Keyboard',
		'1.4',
		'1.4',
		1787534413
	), -- 2026-08-24
	(
		'cyclops',
		'Mouse & Keyboard',
		'0.95',
		'0.95',
		1792541756
	), -- 2026-10-21
	(
		'daredevil',
		'Mouse & Keyboard',
		'1.4',
		'1.4',
		1787534378
	), -- 2026-08-24
	(
		'deadpool',
		'Mouse & Keyboard',
		'1.4',
		'1.4',
		1787533167
	), -- 2026-08-24
	(
		'elsa_bloodstone',
		'Mouse & Keyboard',
		'1.3',
		'1.3',
		1792384622
	), -- 2026-10-19
	(
		'hela',
		'Mouse & Keyboard',
		'0.86',
		'0.86',
		1792385355
	), -- 2026-10-19
	(
		'luna_snow',
		'Mouse & Keyboard',
		'0.86',
		'0.86',
		1792464631
	), -- 2026-10-20
	(
		'magneto',
		'Mouse & Keyboard',
		'1.1',
		'1.1',
		1791930508
	), -- 2026-10-13
	(
		'phoenix',
		'Mouse & Keyboard',
		'0.86',
		'0.86',
		1792384944
	), -- 2026-10-19
	(
		'scarlet_witch',
		'Mouse & Keyboard',
		'1.7',
		'1.7',
		1789161728
	), -- 2026-09-11
	(
		'the_punisher',
		'Mouse & Keyboard',
		'0.86',
		'0.86',
		1792384890
	), -- 2026-10-19
	(
		'venom',
		'Mouse & Keyboard',
		'1.2',
		'1.2',
		1787534444
	), -- 2026-08-24
	(
		'winter_soldier',
		'Mouse & Keyboard',
		'1.1',
		'1.1',
		1787255020
	), -- 2026-08-20
	(
		'wolverine',
		'Mouse & Keyboard',
		'2.0',
		'2.0',
		1784945043
	);

-- 2026-07-25
-- The 'All Heroes' profile, used as the default for heroes without a row in sens_data
INSERT INTO
	global_sens_data (type, x_axis, y_axis, updated_at)
VALUES
	('Controller', '262', '212', 1791764799);

-- 2026-10-12
