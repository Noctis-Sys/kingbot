import { ping } from './ping';
import { duel } from './duel';
import { aura } from './aura';
export const commands = [ping, duel, aura];

export const commandMap = new Map(commands.map((c) => [c.definition.name, c]));