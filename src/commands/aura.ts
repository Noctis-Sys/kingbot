import type { Command } from './types';
import {
    ApplicationCommandOptionType,
    InteractionResponseType,
    type APIChatInputApplicationCommandInteraction,
    type APIApplicationCommandInteractionDataUserOption
} from 'discord-api-types/v10';
import { errorReply } from '../util/errorHandling';
import { randInt } from '../util/math';

/**
 * A command that allows users to check their aura number or the aura number of another user. The aura number is randomly generated between 1 and 1000.
 */
export const aura: Command = {
    definition: {
        name: 'aura',
        description: 'Get your aura number',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'target',
                description: 'Who you want to check aura number',
                required: false
            }
        ]
    },
    handler: async (interaction) => {
        const i = interaction as APIChatInputApplicationCommandInteraction;
        const invoker = i.member?.user ?? i.user;
        if (!invoker) {
            return errorReply('Could not identify who invoked this command.');
        }

        const option = i.data.options?.find(
            (o): o is APIApplicationCommandInteractionDataUserOption =>
                o.name === 'target' && o.type === ApplicationCommandOptionType.User
        );

        let target = invoker;
        if(option && i.data.resolved?.users?.[option.value]) {
            target = i.data.resolved.users[option.value];
        }
       
        const content = `<@${target.id}> has ${randInt(1, 1000)} aura`;
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content,
                allowed_mentions: { parse: [], users: [] }
            }
        }
    }
}