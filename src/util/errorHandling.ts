import { MessageFlags, type APIInteractionResponse, InteractionResponseType } from 'discord-api-types/v10';

/**
 * Creates an ephemeral reply for an Interaction
 * @param content Message content for Interaction reply
 * @returns The Interaction response object
 */
export const errorReply = (content: string): APIInteractionResponse => ({
	type: InteractionResponseType.ChannelMessageWithSource,
	data: { content, flags: MessageFlags.Ephemeral },
});
