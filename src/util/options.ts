import { ApplicationCommandOptionType, type APIApplicationCommandInteractionDataOption } from 'discord-api-types/v10';

export function getStringOption(options: APIApplicationCommandInteractionDataOption[] | undefined, name: string): string | undefined {
	const option = options?.find((o) => o.name === name && o.type === ApplicationCommandOptionType.String);
	return option?.type === ApplicationCommandOptionType.String ? option.value : undefined;
}

export function getAutocompleteOption(options: APIApplicationCommandInteractionDataOption[]): string {
	const focused = options.find((o) => o.type === ApplicationCommandOptionType.String && o.focused);
	const query = focused?.type === ApplicationCommandOptionType.String ? focused.value : '';
	return query;
}
