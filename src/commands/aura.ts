import type { Command } from './types';
import {
    ApplicationCommandOptionType,
    InteractionResponseType,
    type APIChatInputApplicationCommandInteraction,
    type APIApplicationCommandInteractionDataUserOption
} from 'discord-api-types/v10';
import { errorReply } from '../util/errorHandling';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

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
       
        const content = `<@${target.id}>'s aura number is ${randInt(1, 100)}.`;
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content,
                allowed_mentions: { parse: [], users: [] }
            }
        }
    }
}