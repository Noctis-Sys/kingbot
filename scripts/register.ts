import { commands } from '../src/commands/index';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';

const SCOPES = ['guild', 'global', 'clear-guild'] as const;
type Scope = (typeof SCOPES)[number];

interface ScopeContext {
	appId: string;
	guildId: string | undefined;
	definitions: RESTPostAPIApplicationCommandsJSONBody[];
}

interface Registration {
	url: string;
	payload: RESTPostAPIApplicationCommandsJSONBody[];
	summary: string;
}

const parseScope = (raw: string | undefined): Scope => {
	if (!SCOPES.includes(raw as Scope)) {
		const problem = raw === undefined ? 'No scope given' : `Invalid scope: ${raw}`;
		throw new Error(`${problem}. Must be one of: ${SCOPES.join(', ')}`);
	}
	return raw as Scope;
};

const guildUrl = ({ appId, guildId }: ScopeContext): string => {
	if (!guildId) {
		throw new Error('DISCORD_TEST_GUILD_ID must be set in .env for guild registration & clearing commands');
	}
	return `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`;
};

const scopeHandlers: Record<Scope, (ctx: ScopeContext) => Registration> = {
	guild: (ctx) => ({
		url: guildUrl(ctx),
		payload: ctx.definitions,
		summary: `Registered ${ctx.definitions.length} command(s) to guild ${ctx.guildId}`,
	}),
	global: (ctx) => ({
		url: `https://discord.com/api/v10/applications/${ctx.appId}/commands`,
		payload: ctx.definitions,
		summary: `Registered ${ctx.definitions.length} command(s) globally (propagation can take up to an hour)`,
	}),
	'clear-guild': (ctx) => ({
		url: guildUrl(ctx),
		payload: [],
		summary: `Cleared all guild commands from guild ${ctx.guildId}`,
	}),
};

async function main() {
	const appId = process.env.DISCORD_APPLICATION_ID;
	const token = process.env.DISCORD_TOKEN;
	const guildId = process.env.DISCORD_TEST_GUILD_ID;
	const scope = parseScope(process.argv[2]);

	if (!appId || !token) {
		throw new Error('DISCORD_APPLICATION_ID and DISCORD_TOKEN must be set in .env');
	}

	const definitions = commands.map((c) => c.definition);
	const { url, payload, summary } = scopeHandlers[scope]({ appId, guildId, definitions });

	const res = await fetch(url, {
		method: 'PUT',
		headers: {
			Authorization: `Bot ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		throw new Error(`Failed to register commands: ${res.status} ${await res.text()}`);
	}
	console.log(summary);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
