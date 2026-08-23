import type { Command } from './types';
import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type APIChatInputApplicationCommandInteraction,
} from 'discord-api-types/v10';
import { errorReply } from '../util/errorHandling';
import { getStringOption } from '../util/options';

const SENS_DATA: Record<string, string> = {
    all: 'All Heros - 262 Horizontal 212 Vertical. Different for some characters, use /sens [hero name here] (remove [ ]) for other sens',
    magik: 'Magik (Controller): 295 Horizontal 256 Vertical',
    bucky: 'Bucky (Mouse & Keyboard): Horizontal - 1.1: Vertical - 1.1',
    daredevil: 'Daredevil (Controller): Horizontal 440 Vertical 400',
    deadpool: 'Deadpool (Mouse & Keyboard): horizontal: 1.2 - vertical: 1.2',
    elsa: 'Elsa (Mouse & Keyboard): Horizontal and Vertical Sensitivity 2.30',
    hela: 'Hela (Controller): Horizontal - 154 Vertical - 114',
    luna: 'Luna (Mouse & Keyboard): Horizontal - 0.95 Vertical - 0.95',
    magneto: 'Magneto (Mouse & Keyboard): Horizontal - 1.2 Vertical - 1.2',
    psylocke: 'Psylocke (Controller): Horizontal - 256 Vertical - 216',
    punisher: 'Punisher (Controller): Horizontal - 256 Vertical - 216',
    spiderman: 'Spiderman (Controller): 261 Horizontal 301 Vertical',
    wintersoldier: 'Winter Soldier (Mouse & Keyboard): Horizontal - 1.1: Vertical - 1.1',
    wolverine: 'Wolverine (Mouse & Keyboard): Horizontal: 2.0 Vertical 2.0',
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
					{
						name: 'Daredevil',
						value: 'daredevil',
					},
					{
						name: 'Deadpool',
						value: 'deadpool',
					},
					{
						name: 'DP',
						value: 'dp',
					},
					{
						name: 'Elsa',
						value: 'elsa',
					},
					{
						name: 'Hela',
						value: 'hela',
					},
					{
						name: 'Luna',
						value: 'luna',
					},
					{
						name: 'Magneto',
						value: 'magneto',
					},
					{
						name: 'Psylocke',
						value: 'psylocke',
					},
					{
						name: 'Punisher',
						value: 'punisher',
					},
					{
						name: 'Spiderman',
						value: 'spiderman',
					},
					{
						name: 'Winter Soldier',
						value: 'wintersoldier',
					},
					{
						name: 'Wolverine',
						value: 'wolverine',
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
                    content: SENS_DATA['all'],
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
