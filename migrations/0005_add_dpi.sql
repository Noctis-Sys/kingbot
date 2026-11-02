-- Add mouse DPI to the sens tables. DPI only applies to Mouse & Keyboard rows; NULL means unknown.
ALTER TABLE sens_data ADD COLUMN dpi INTEGER CHECK (dpi IS NULL OR (type = 'Mouse & Keyboard' AND dpi > 0));

ALTER TABLE global_sens_data ADD COLUMN dpi INTEGER CHECK (dpi IS NULL OR (type = 'Mouse & Keyboard' AND dpi > 0));
