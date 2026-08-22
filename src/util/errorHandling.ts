import { MessageFlags, type APIInteractionResponse, InteractionResponseType} from 'discord-api-types/v10';

export const errorReply = (content: string): APIInteractionResponse => ({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content, flags: MessageFlags.Ephemeral },
});