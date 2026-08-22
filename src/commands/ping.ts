import  { InteractionResponseType } from 'discord-api-types/v10';
import type { Command } from './types';

/**
 * A simple command that responds with "Pong" when invoked, used to check if the bot is alive and responsive.
 */
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