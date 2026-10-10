import {
	ApplicationCommandOptionType,
	CDNRoutes,
	ImageFormat,
	InteractionResponseType,
	RouteBases,
	type APIChatInputApplicationCommandInteraction,
	type APIInteractionResponse,
	type APIUser,
	type DefaultUserAvatarAssets,
} from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';
import { getBooleanOption } from '../util/options';
import { getChargeLeaderboard, recordCharge } from '../db/charges';

// Must be a direct link to the .gif file — embeds don't render a GIF from a page URL.
const CHARGE_GIF_URL = 'https://static2.klipy.com/ii/35ccce3d852f7995dd2da910f2abd795/d4/e3/3tK93Eif.gif';
const CHARGE_COLOR = 0xc0392b;
const LEADERBOARD_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Shows the top chargers and the global total. Reads only — viewing the leaderboard doesn't count as a charge.
 */
async function leaderboardReply(db: D1Database): Promise<APIInteractionResponse> {
	let board;
	try {
		board = await getChargeLeaderboard(db, LEADERBOARD_SIZE);
	} catch (error) {
		console.error('[charge] Failed to load leaderboard:', error);
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
}

/**
 * The user's avatar URL, animated if they have one, or Discord's default avatar when they have none.
 */
function avatarUrl(user: APIUser): string {
	if (user.avatar) {
		const format = user.avatar.startsWith('a_') ? ImageFormat.GIF : ImageFormat.PNG;
		return RouteBases.cdn + CDNRoutes.userAvatar(user.id, user.avatar, format);
	}
	// Migrated (discriminator "0") users index by snowflake; legacy users by discriminator.
	const index = user.discriminator === '0' ? Number((BigInt(user.id) >> 22n) % 6n) : Number(user.discriminator) % 5;
	return RouteBases.cdn + CDNRoutes.defaultUserAvatar(index as DefaultUserAvatarAssets);
}

/**
 * Replies with an embed showing the invoker charging into battle, or the leaderboard when `leaderboard: True`.
 */
export const charge: Command = {
	definition: {
		name: 'charge',
		description: 'CHARGE!',
		options: [
			{
				type: ApplicationCommandOptionType.Boolean,
				name: 'leaderboard',
				description: 'Show the top chargers instead of charging',
				required: false,
			},
		],
	},
	handler: async (interaction, env) => {
		const i = interaction as APIChatInputApplicationCommandInteraction;
		if (getBooleanOption(i.data.options, 'leaderboard')) {
			return leaderboardReply(env.DB);
		}

		const invoker = interaction.member?.user ?? interaction.user;
		if (!invoker) {
			return errorReply('Could not identify who invoked this command.');
		}

		// A failed count (e.g. the D1 free-tier daily limit) shouldn't stop the charge — it just goes out without a footer.
		let total: number | undefined;
		try {
			total = await recordCharge(env.DB, invoker.id);
		} catch (error) {
			console.error('[charge] Failed to record charge:', error);
		}

		const name = interaction.member?.nick ?? invoker.global_name ?? invoker.username;
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [
					{
						color: CHARGE_COLOR,
						author: { name: `${name} is charging!`, icon_url: avatarUrl(invoker) },
						image: { url: CHARGE_GIF_URL },
						footer: total === undefined ? undefined : { text: `Charge #${total.toLocaleString('en-US')}` },
					},
				],
			},
		};
	},
};
