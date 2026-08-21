import { verifyKey} from 'discord-interactions';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Kingbot is running!');
		}

		const signature = request.headers.get('x-signature-ed25519');
		const timestamp = request.headers.get('x-signature-timestamp');

		const body = await request.text();
		if(signature === null || timestamp === null) {
			return new Response('Missing signature or timestamp', { status: 401 });
		}
		const verifiedKey = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

		const valid = signature && timestamp && verifiedKey;
		if (!valid) {
			return new Response('Invalid request', { status: 401 });
		}

		const interaction = JSON.parse(body);
		console.log('Interaction:', JSON.stringify(interaction,null,2));

		if (interaction.type === 1) {
			return Response.json({ type: 1 });
		}

		if (interaction.type === 2) {
			return Response.json({
				type: 4,
				data: {
					content: 'PONG',
					flags: 64,
				}
			})
		}

		return new Response('Unhandled interaction type', { status: 400 });
	}
} satisfies ExportedHandler<Env>;