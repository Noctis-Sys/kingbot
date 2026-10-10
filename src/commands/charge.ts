import {
	CDNRoutes,
	ImageFormat,
	InteractionResponseType,
	RouteBases,
	type APIUser,
	type DefaultUserAvatarAssets,
} from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';

// Must be a direct link to the .gif file — embeds don't render a GIF from a page URL.
const CHARGE_GIF_URL = 'https://static2.klipy.com/ii/35ccce3d852f7995dd2da910f2abd795/d4/e3/3tK93Eif.gif';
const CHARGE_COLOR = 0xc0392b;

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
 * Replies with an embed showing the invoker charging into battle.
 */
export const charge: Command = {
	definition: {
		name: 'charge',
		description: 'CHARGE!',
	},
	handler: async (interaction) => {
		const invoker = interaction.member?.user ?? interaction.user;
		if (!invoker) {
			return errorReply('Could not identify who invoked this command.');
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
					},
				],
			},
		};
	},
};
