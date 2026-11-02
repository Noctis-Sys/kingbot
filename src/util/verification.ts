import { APIChatInputApplicationCommandInteraction, APIApplicationCommandAutocompleteInteraction } from 'discord-api-types/v10';

export function isAllowed(
	interaction: APIChatInputApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction,
	env: Env,
): boolean {
	const user = interaction.member?.user ?? interaction.user;
	if (user?.id === env.OWNER_ID) return true;
	return interaction.guild_id === env.KINGSMAN265_HQ && (interaction.member?.roles.includes(env.KINGSMAN265_HQ_STAFF) ?? false);
}
