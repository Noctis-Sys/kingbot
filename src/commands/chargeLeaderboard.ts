import { InteractionResponseType } from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';
import { getChargeLeaderboard } from '../db/charges';
import { CHARGE_COLOR } from './charge';

const LEADERBOARD_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Shows the top chargers and the global charge total. Reads only — viewing the leaderboard doesn't count as a charge.
 */
export const chargeLeaderboard: Command = {
	definition: {
		name: 'chargeleaderboard',
		description: 'Show the top chargers',
	},
	handler: async (_interaction, env) => {
		let board;
		try {
			board = await getChargeLeaderboard(env.DB, LEADERBOARD_SIZE);
		} catch (error) {
			console.error('[chargeleaderboard] Failed to load leaderboard:', error);
			return errorReply('The leaderboard is unavailable right now. Please try again later.');
		}

		const lines = board.top.map((row, i) => `${MEDALS[i] ?? `**${i + 1}.**`} <@${row.user_id}> — ${row.count.toLocaleString('en-US')}`);
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [
					{
						color: CHARGE_COLOR,
						title: 'Charge Leaderboard',
						description: lines.length > 0 ? lines.join('\n') : 'No one has charged yet.',
						footer: { text: `${board.total.toLocaleString('en-US')} charges in total` },
					},
				],
				allowed_mentions: { parse: [], users: [] },
			},
		};
	},
};
