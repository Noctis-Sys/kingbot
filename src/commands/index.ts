import { ping } from './ping';
import { duel } from './duel';
import { aura } from './aura';
import { sens } from './sens';
import { charge } from './charge';
import { chargeLeaderboard } from './chargeLeaderboard';
export const commands = [ping, duel, aura, sens, charge, chargeLeaderboard];

export const commandMap = new Map(commands.map((c) => [c.definition.name, c]));
