// src/commands/duel.ts
import {
    ApplicationCommandOptionType,
    InteractionResponseType,
    type APIChatInputApplicationCommandInteraction,
    type APIApplicationCommandInteractionDataUserOption,
    MessageFlags,
    type APIInteractionResponse,
} from 'discord-api-types/v10';
import type { Command } from './types';
import { errorReply } from '../util/errorHandling';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const duel: Command = {
    definition: {
        name: 'duel',
        description: 'Shoot it out with someone',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'target',
                description: 'Who you want to fight',
                required: true,
            },
        ],
    },
    handler: async (interaction) => {
        const i = interaction as APIChatInputApplicationCommandInteraction;

        const challenger = i.member?.user ?? i.user;
        if (!challenger) {
            return errorReply('Could not identify who invoked this command.');
        }

        const option = i.data.options?.find(
            (o): o is APIApplicationCommandInteractionDataUserOption =>
                o.name === 'target' && o.type === ApplicationCommandOptionType.User,
        );
        const target = option && i.data.resolved?.users?.[option.value];
        if (!target) {
            return errorReply('Could not find that user.');
        }

        const winner = Math.random() < 0.5 ? challenger : target;

        const content =
            `<@${challenger.id}> decided to fight <@${target.id}>. ` +
            `<@${challenger.id}> has ${randInt(1, 100)} bullets and ${randInt(1, 100)}% accuracity. ` +
            `<@${target.id}> has ${randInt(1, 100)} bullets and ${randInt(1, 100)}% accuracity. ` +
            `shoots and shoots get shooted until... <@${winner.id}> wins!`;

        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content,
                allowed_mentions: { parse: [], users: [] },
            },
        };
    },
};