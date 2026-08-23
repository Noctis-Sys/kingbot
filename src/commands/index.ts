import { ping } from './ping';
import { duel } from './duel';
import { aura } from './aura';
import { sens } from './sens';
export const commands = [ping, duel, aura, sens];

export const commandMap = new Map(commands.map((c) => [c.definition.name, c]));