import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	type APIChatInputApplicationCommandInteraction,
	type APIApplicationCommandAutocompleteInteraction,
} from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';
import { getStringOption, getAutocompleteOption } from '../util/options';
import { getRosterData, getSensProfile, getGlobalSensProfile } from '../db/query';

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
				autocomplete: true,
			},
		],
	},
	handler: async (interaction, env) => {
		const i = interaction as APIChatInputApplicationCommandInteraction;
		const query = getStringOption(i.data.options, 'character');
		let sensProfiles;
		try {
			if (!query) {
				sensProfiles = await getGlobalSensProfile(env.DB);
			} else {
				sensProfiles = await getSensProfile(env.DB, query);
			}
		} catch (error) {
			console.error('[sens] Failed to load sens profiles:', error);
			return errorReply('Failed to load sens profiles. Please try again later.');
		}

		if (sensProfiles.length === 0) {
			return errorReply(`No sens profiles found for character: ${query ?? 'All Heroes'}`);
		}

		let embedDescription = '';

		if (sensProfiles[0].type === null) {
			embedDescription = 'No sens data available for this character.';
		} else {
			for (const profile of sensProfiles) {
				embedDescription += profile.type === 'Mouse & Keyboard' ? '🖱️' : '🎮';
				embedDescription += `**${profile.type}**: ${profile.x_axis} & ${profile.y_axis}\n\n`;
			}
		}

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [
					{
						color: 0x00ff00,
						title: `Sens for ${sensProfiles[0].name}`,
						description: embedDescription,
					},
				],
				allowed_mentions: { parse: [], users: [] },
			},
		};
	},
	autocomplete: async (interaction, env) => {
		let roster;
		const i = interaction as APIApplicationCommandAutocompleteInteraction;
		const query = getAutocompleteOption(i.data.options);
		try {
			roster = await getRosterData(env.DB, query);
		} catch (error) {
			console.error('[sens] Failed to load roster data:', error);
			return {
				type: InteractionResponseType.ApplicationCommandAutocompleteResult,
				data: {
					choices: [],
				},
			};
		}
		return {
			type: InteractionResponseType.ApplicationCommandAutocompleteResult,
			data: {
				choices: roster.map((p) => ({ name: p.name, value: p.slug })),
			},
		};
	},
};
