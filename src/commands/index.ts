import { ping } from './ping';
import { duel } from './duel';
export const commands = [ping, duel];

export const commandMap = new Map(commands.map((c) => [c.definition.name, c]));