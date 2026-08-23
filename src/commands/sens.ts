import type { Command } from './types';
import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type APIChatInputApplicationCommandInteraction,
} from 'discord-api-types/v10';
import { errorReply } from '../util/errorHandling';
import { getStringOption } from '../util/options';

const SENS_DATA: Record<string, string> = {
    magik: 'Magik (Controller): 295 Horizontal 256 Vertical',
    bucky: 'Bucky (Mouse & Keyboard): Horizontal - 1.1: Vertical - 1.1',
};

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
        const i = interaction as APIChatInputApplicationCommandInteraction;
        const character = getStringOption(i.data.options, 'character');

        // Base path
        if (!character) {
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `All Heros - 262 Horizontal 212 Vertical. Different for some characters, use /sens [put ur hero here] (remove [ ]) for other sens`,
                    allowed_mentions: { parse: [], users: [] },
                }
            }
        }

        if(!SENS_DATA[character]){
            return errorReply(`No sens data found for ${character}.`);
        }

        // Money path
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: SENS_DATA[character],
                allowed_mentions: { parse: [], users: [] },
            },
        };
    },
};
