-- Seed the known mouse DPI (800) on every Mouse & Keyboard row.
-- updated_at is left alone: the sens values didn't change, the DPI just wasn't recorded before.
UPDATE sens_data SET dpi = 800 WHERE type = 'Mouse & Keyboard';

-- Seed the All Heroes Mouse & Keyboard sens.
INSERT INTO
	global_sens_data (type, x_axis, y_axis, dpi, updated_at)
VALUES
	('Mouse & Keyboard', '1.90', '1.90', 800, 1793591932);
