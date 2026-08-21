import type {
	APIApplicationCommandInteraction,
	APIInteractionResponse,
	RESTPostAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10';

export interface Command {
	definition: RESTPostAPIApplicationCommandsJSONBody;
	handler: (
		interaction: APIApplicationCommandInteraction,
		env: Env,
		ctx: ExecutionContext,
	) => Promise<APIInteractionResponse>;
}