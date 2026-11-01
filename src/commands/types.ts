import type {
	APIApplicationCommandInteraction,
	APIInteractionResponse,
	RESTPostAPIApplicationCommandsJSONBody,
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandAutocompleteResponse,
} from 'discord-api-types/v10';

/**
 * Represents a command that can be registered with the Discord API and executed in response to an interaction.
 */
export interface Command {
	definition: RESTPostAPIApplicationCommandsJSONBody;
	handler: (interaction: APIApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<APIInteractionResponse>;
	developerOnly?: boolean;
	autocomplete?: (
		interaction: APIApplicationCommandAutocompleteInteraction,
		env: Env,
		ctx: ExecutionContext,
	) => Promise<APIApplicationCommandAutocompleteResponse>;
}
