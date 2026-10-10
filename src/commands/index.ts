import { ping } from './ping';
import { duel } from './duel';
import { aura } from './aura';
import { sens } from './sens';
import { charge } from './charge';
export const commands = [ping, duel, aura, sens, charge];

export const commandMap = new Map(commands.map((c) => [c.definition.name, c]));
