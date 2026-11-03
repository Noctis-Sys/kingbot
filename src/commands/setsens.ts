import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type APIChatInputApplicationCommandInteraction,
	type APIApplicationCommandAutocompleteInteraction,
	ComponentType,
	ButtonStyle,
} from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';
import { getStringOption, getAutocompleteOption } from '../util/options';
import { getRosterData, getSensProfile, getGlobalSensProfile } from '../db/query';
import { ALL_CHARACTERS, isAllCharacters, suggestsAllCharacters } from '../util/allCharacters';
import { isAllowed } from '../util/verification';
import { buildSensEmbed } from '../util/formatting';

export const setsens: Command = {
	developerOnly: true,
	definition: {
		name: 'setsens',
		description: 'Set a sens profile for a character',
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: 'character',
				description: 'The character to set sens for',
				required: false,
				autocomplete: true,
			},
		],
	},
	handler: async (interaction, env) => {
		const i = interaction as APIChatInputApplicationCommandInteraction;
		const query = getStringOption(i.data.options, 'character')?.toLowerCase();

		if (!isAllowed(i, env)) {
			return errorReply('You are not allowed to use this command.');
		}
		let sensProfiles;
		let id: string;
		try {
			if (!query || isAllCharacters(query)) {
				sensProfiles = await getGlobalSensProfile(env.DB);
				id = ALL_CHARACTERS.value;
			} else {
				sensProfiles = await getSensProfile(env.DB, query);
				id = sensProfiles[0]?.slug ?? query;
			}
		} catch (error) {
			console.error('[setsens] Failed to fetch sens profiles:', error);
			return errorReply('Failed to fetch sens profiles. Please try again later.');
		}
		if (sensProfiles.length === 0) {
			return errorReply(`No character found: <${query ?? ALL_CHARACTERS.name}>`);
		}

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [buildSensEmbed(sensProfiles, `No sens profiles found for character: ${query ?? ALL_CHARACTERS.name}`)],
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{ type: ComponentType.Button, style: ButtonStyle.Primary, label: 'Controller', custom_id: `setsens:${id}:controller` },
							{ type: ComponentType.Button, style: ButtonStyle.Primary, label: 'Mouse & Keyboard', custom_id: `setsens:${id}:mkb` },
						],
					},
				],
				flags: MessageFlags.Ephemeral,
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
			console.error('[setsens] Failed to load roster data:', error);
			return {
				type: InteractionResponseType.ApplicationCommandAutocompleteResult,
				data: {
					choices: [],
				},
			};
		}
		const choices = roster.map((p) => ({ name: p.name, value: p.slug }));
		// "All Characters" isn't a hero_roster row; the handler maps its value to the global profile.
		if (suggestsAllCharacters(query)) {
			choices.unshift({ ...ALL_CHARACTERS });
		}
		return {
			type: InteractionResponseType.ApplicationCommandAutocompleteResult,
			data: {
				// Discord rejects the whole response (not just the extras) above 25 choices.
				choices: choices.slice(0, 25),
			},
		};
	},
};
