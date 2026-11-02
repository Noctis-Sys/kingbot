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
		let sensProfiles;
		try {
			if (!query || query === 'all heroes') {
				sensProfiles = await getGlobalSensProfile(env.DB);
			} else {
				sensProfiles = await getSensProfile(env.DB, query);
			}
		} catch (error) {
			console.error('[setsens] Failed to fetch sens profiles:', error);
			return errorReply('Failed to fetch sens profiles. Please try again later.');
		}
		if (sensProfiles.length === 0) {
			return errorReply(`No hero found: <${query ?? 'All Heroes'}>`);
		}

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `Found: ${sensProfiles[0].name} (${sensProfiles[0].slug ?? 'global'})`,
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
		// "All Heroes" isn't a hero_roster row; the handler maps its value to the global profile.
		if ('all heroes'.includes(query.toLowerCase())) {
			choices.unshift({ name: 'All Heroes', value: 'all heroes' });
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
