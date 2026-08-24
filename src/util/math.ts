/**
 * Generates a random integer between the specified minimum and maximum values (inclusive).
 *
 * @param min The minimum value (inclusive).
 * @param max The maximum value (inclusive).
 * @returns A random integer between min and max.
 */
export const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
