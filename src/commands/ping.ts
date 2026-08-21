import  { InteractionResponseType } from 'discord-api-types/v10';
import type { Command } from './types';

export const ping: Command = {
	definition: {
		name: 'ping',
		description: 'Check the bot is alive',
	},
	handler: async () => ({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: { content: 'Pong' },
	}),
};