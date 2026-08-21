import { commands } from '../src/commands/index';

async function main() {
	const appId = process.env.DISCORD_APPLICATION_ID;
	const token = process.env.DISCORD_TOKEN;
	const guildId = process.env.DISCORD_TEST_GUILD_ID;

	if (!appId || !token) {
		throw new Error('DISCORD_APPLICATION_ID and DISCORD_TOKEN must be set in .env');
	}

	const url = guildId
		? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
		: `https://discord.com/api/v10/applications/${appId}/commands`;

	const res = await fetch(url, {
		method: 'PUT',
		headers: {
			Authorization: `Bot ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(commands.map((c) => c.definition)),
	});

	if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

	console.log(`Registered ${commands.length} command(s)${guildId ? ` to guild ${guildId}` : ' globally'}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});