import type { Command } from './types';
import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type APIChatInputApplicationCommandInteraction,
} from 'discord-api-types/v10';
import { errorReply } from '../util/errorHandling';
import { getStringOption } from '../util/options';

type SensProfile = {
	name: string;
	value: string;
	input: 'Controller' | 'Mouse & Keyboard' | 'N/A';
	horizontal: string;
	vertical: string;
};

const SENS_PROFILES: SensProfile[] = [
	{ name: 'Magik',            value: 'magik',         input: 'Controller',        horizontal: '295',      vertical: '256' },
	{ name: 'Bucky',            value: 'bucky',         input: 'Mouse & Keyboard',  horizontal: '1.1',      vertical: '1.1' },
	{ name: 'Daredevil',        value: 'daredevil',     input: 'Controller',        horizontal: '440',      vertical: '400' },
	{ name: 'Deadpool',         value: 'deadpool',      input: 'Mouse & Keyboard',  horizontal: '1.2',      vertical: '1.2' },
	{ name: 'Elsa',             value: 'elsa',          input: 'Mouse & Keyboard',  horizontal: '2.30',     vertical: '2.30' },
	{ name: 'Hela',             value: 'hela',          input: 'Controller',        horizontal: '154',      vertical: '114' },
	{ name: 'Luna',             value: 'luna',          input: 'Mouse & Keyboard',  horizontal: '0.95',     vertical: '0.95' },
	{ name: 'Magneto',          value: 'magneto',       input: 'Mouse & Keyboard',  horizontal: '1.2',      vertical: '1.2' },
	{ name: 'Psylocke',         value: 'psylocke',      input: 'Controller',        horizontal: '256',      vertical: '216' },
	{ name: 'Punisher',         value: 'punisher',      input: 'Controller',        horizontal: '256',      vertical: '216' },
	{ name: 'Spiderman',        value: 'spiderman',     input: 'Controller',        horizontal: '261',      vertical: '301' },
	{ name: 'Winter Soldier',   value: 'wintersoldier', input: 'Mouse & Keyboard',  horizontal: '1.1',      vertical: '1.1' },
	{ name: 'Wolverine',        value: 'wolverine',     input: 'Mouse & Keyboard',  horizontal: '2.0',      vertical: '2.0' },
	{ name: 'All Heros',        value: 'all',           input: 'Controller',        horizontal: '262',      vertical: '212' },
];

const SENS_MAP = new Map<string, SensProfile>(SENS_PROFILES.map((p) => [p.value, p]));

const formatSens = (p: SensProfile) => `${p.name} Sens:\nInput: ${p.input}\nHorizontal: ${p.horizontal}\nVertical: ${p.vertical}`;

export const sens: Command = {
	developerOnly: false,
	definition: {
		name: 'sens',
		description: 'Get kingsmans sens',
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: 'character',
				description: 'The character to get sens for',
				required: false,
				choices: SENS_PROFILES.map((p) => ({ name: p.name, value: p.value })),
			},
		],
	},
	handler: async (interaction) => {
		const i = interaction as APIChatInputApplicationCommandInteraction;
		const character = getStringOption(i.data.options, 'character');

		const profile = SENS_MAP.get(character ?? 'all');
		if (!profile) {
			return errorReply('Invalid character specified. Please choose a valid character from the list.');
		}
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: formatSens(profile),
				allowed_mentions: { parse: [], users: [] },
			},
		};
	},
};
