import type { Command } from './types';
import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type APIChatInputApplicationCommandInteraction,
	type APIApplicationCommandInteractionDataUserOption,
} from 'discord-api-types/v10';
import { errorReply } from '../util/errorHandling';

export const sens: Command = {
    developerOnly: true,
	definition: {
		name: 'sens',
		description: 'Get kingsmans sens',
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: 'character',
				description: 'The character to get sens for',
				required: false,
				choices: [
					{
						name: 'Magik',
						value: 'magik',
					},
					{
						name: 'Bucky',
						value: 'bucky',
					},
				],
			},
		],
	},
	handler: async (interaction) => {
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: 'Not implemented yet.',
                allowed_mentions: { parse: [], users: [] },
            },
        };
    },
};
