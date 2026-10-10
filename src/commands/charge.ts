import { InteractionResponseType } from 'discord-api-types/v10';
import type { Command } from './types';

// Must be a direct link to the .gif file — embeds don't render a GIF from a page URL.
const CHARGE_GIF_URL = 'https://static2.klipy.com/ii/35ccce3d852f7995dd2da910f2abd795/d4/e3/3tK93Eif.gif';

/**
 * Replies with an embed showing the charge GIF.
 */
export const charge: Command = {
	definition: {
		name: 'charge',
		description: 'CHARGE!',
	},
	handler: async () => ({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			embeds: [{ title: 'CHARGE!', image: { url: CHARGE_GIF_URL } }],
		},
	}),
};
