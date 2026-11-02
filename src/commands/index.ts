import { ping } from './ping';
import { duel } from './duel';
import { aura } from './aura';
import { sens } from './sens';
import { charge } from './charge';
import { setsens } from './setsens';
import { chargeLeaderboard } from './chargeLeaderboard';
export const commands = [ping, duel, aura, sens, charge, setsens, chargeLeaderboard];

export const commandMap = new Map(commands.map((c) => [c.definition.name, c]));
