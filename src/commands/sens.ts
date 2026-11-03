import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	MessageFlags,
	type APIChatInputApplicationCommandInteraction,
	type APIApplicationCommandAutocompleteInteraction,
} from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';
import { getStringOption, getAutocompleteOption } from '../util/options';
import { getRosterData, getSensProfile, getGlobalSensProfile } from '../db/query';
import { ALL_CHARACTERS, isAllCharacters, suggestsAllCharacters } from '../util/allCharacters';
import { buildSensContainer } from '../util/formatting';

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
		const query = getStringOption(i.data.options, 'character')?.toLowerCase();
		let sensProfiles;
		try {
			// A bare `/sens` and a typed "All Characters" both mean the global profile, which isn't a row in hero_roster.
			if (!query || isAllCharacters(query)) {
				sensProfiles = await getGlobalSensProfile(env.DB);
			} else {
				sensProfiles = await getSensProfile(env.DB, query);
			}
		} catch (error) {
			console.error('[sens] Failed to load sens profiles:', error);
			return errorReply('Failed to load sens profiles. Please try again later.');
		}

		if (sensProfiles.length === 0) {
			return errorReply(`No sens profiles found for character: ${query ?? ALL_CHARACTERS.name}`);
		}

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				flags: MessageFlags.IsComponentsV2,
				components: [buildSensContainer(sensProfiles, `No sens profile available for **${sensProfiles[0].name}**. Try </sens:1566315254504235163> or </sens:1566315254504235163> \`${ALL_CHARACTERS.name}\` for the **${ALL_CHARACTERS.name}** sens.`)],
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
