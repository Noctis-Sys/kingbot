import { InteractionResponseType, InteractionType, MessageFlags, type APIInteraction } from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { commandMap } from './commands/index';
import { errorReply } from './util/errorHandling';

type RouteHandler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;

const routes: Record<string, RouteHandler> = {
	'/health': () => new Response('OK', { status: 200 }),
	'/legal/terms-of-service': () => fetch('https://kingbot-c36.pages.dev/terms-of-service'),
	'/legal/privacy-policy': () => fetch('https://kingbot-c36.pages.dev/privacy-policy'),
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'GET') {
			const handler = routes[url.pathname];
			if (handler) return handler(request, env, ctx);
		}

		const signature = request.headers.get('x-signature-ed25519');
		const timestamp = request.headers.get('x-signature-timestamp');

		const body = await request.text();
		if (signature === null || timestamp === null) {
			return new Response('Missing signature or timestamp', { status: 401 });
		}
		const verifiedKey = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

		const valid = signature && timestamp && verifiedKey;
		if (!valid) {
			return new Response('Invalid request', { status: 401 });
		}

		const interaction = JSON.parse(body) as APIInteraction;

		if (interaction.type === InteractionType.Ping) {
			return Response.json({ type: InteractionResponseType.Pong });
		}

		if (interaction.type === InteractionType.ApplicationCommand) {
			try {
				const command = commandMap.get(interaction.data.name);
				if (!command) {
					console.log(`[${interaction.data.name}] Unknown command`);
					return Response.json({
						type: InteractionResponseType.ChannelMessageWithSource,
						data: { content: 'Unknown command', flags: MessageFlags.Ephemeral },
					});
				}
				return Response.json(await command.handler(interaction, env, ctx));
			} catch (error) {
				console.error(`[${interaction.data.name}] Error handling command:`, error);
				return Response.json(errorReply('An error occurred while processing the command. Please try again later.'));
			}
		}

		return new Response('Unhandled interaction type', { status: 400 });
	},
} satisfies ExportedHandler<Env>;
