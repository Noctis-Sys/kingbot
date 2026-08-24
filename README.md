# kingbot

A Discord bot that runs as a Cloudflare Worker.

It is an **interaction webhook**, not a Gateway bot. Discord POSTs each slash-command interaction to the Worker's public URL, and the Worker answers in the HTTP response. There is no persistent connection, no storage, and no state — every command is a pure function of its interaction payload.

## Commands

| Command | Options                        | What it does                                                                               |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `/ping` | —                              | Replies `Pong`. Developer-only, so it is never registered globally.                        |
| `/aura` | `target` (user, optional)      | Rolls an "aura" number from 1–1000 for you or someone else.                                |
| `/duel` | `target` (user, required)      | Simulates a shootout between you and the target; the winner is a coin flip.                |
| `/sens` | `character` (choice, optional) | Prints a Marvel Rivals sensitivity profile. With no argument, returns the `All Heros` row. |

## Getting started

### Prerequisites

- Node.js 20+ and npm
- A Cloudflare account (`wrangler` prompts you to log in on first deploy)
- A Discord application — https://discord.com/developers/applications

### Install

```sh
npm install
```

### Secrets

Two gitignored files hold the same four keys for two different runtimes. Copy the checked-in templates and fill in your application's values:

```sh
cp .env.example .env
cp .dev.vars.example .dev.vars
```

Both templates carry all four keys:

```
DISCORD_PUBLIC_KEY="discord_public_key_here"
DISCORD_APPLICATION_ID="discord_application_id_here"
DISCORD_TOKEN="discord_token_here"
DISCORD_TEST_GUILD_ID="discord_test_guild_id_here"
```

The two runtimes each consume a different subset:

- **`.env`** — read by Node for the `register:*` scripts, which use `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, and `DISCORD_TEST_GUILD_ID`.
- **`.dev.vars`** — injected into the Worker by `wrangler dev`. `DISCORD_PUBLIC_KEY` is the one the Worker itself uses, for signature verification.

Find all four in the Discord Developer Portal: the public key and application ID under **General Information**, the token under **Bot**, and the test guild ID by right-clicking your server with Developer Mode on.

`wrangler types` derives the `Env` type from `.dev.vars`, so after adding a var there run `npm run cf-typegen` to make it visible to TypeScript. For production, set values with `wrangler secret put <NAME>` — `wrangler.jsonc` declares no `vars`.

### Run it

```sh
npm run dev        # wrangler dev on http://localhost:8787
```

A GET to that URL returns the liveness string `Kingbot is running!`.

Discord has to be able to reach the endpoint, so point a public tunnel at it (e.g. `cloudflared tunnel --url http://localhost:8787`) and paste that URL into **Interactions Endpoint URL** in the Discord Developer Portal. Discord probes the endpoint when you save it, including with a deliberately bad signature, and rejects it unless the Worker fails that request correctly.

Then register the commands to your test guild so they show up. If commands are not immedietly present, restarting/reloading Discord should
surface the new commands. `ctrl+r` in the discord app and webpage will reload the application.

```sh
npm run register:guild
```

## Deploying and registering are independent steps

Shipping the Worker updates the _handler_. It does not tell Discord the command _exists_. After changing any `definition` you need both:

```sh
npm run deploy           # ships the handler
npm run register:guild   # or register:global — PUTs the definitions to Discord
```

The registration PUT is a **full replace**: a command dropped from the `commands` array disappears from Discord on the next run.

`scripts/register.ts` requires the scope as its one positional argument — there is no default, and an unrecognized scope throws listing the valid ones rather than guessing a target, since a wrong guess here is destructive.

| Script                          | Scope          | Effect                                                                                                    |
| ------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run register:guild`        | `guild`        | PUTs every command to `DISCORD_TEST_GUILD_ID`. Instant — use this while developing.                       |
| `npm run register:global`       | `global`       | PUTs to every guild, **excluding** `developerOnly` commands. Propagation can take up to an hour.          |
| `npm run register:clear-guild`  | `clear-guild`  | PUTs `[]` to the test guild, removing its commands. Prompts to confirm.                                   |
| `npm run register:clear-global` | `clear-global` | PUTs `[]` globally, removing every global command. Prompts to confirm; guild registrations are untouched. |

`guild` and `clear-guild` throw when `DISCORD_TEST_GUILD_ID` is unset — there is no fallback to global. The clearing scopes prompt on stdin; pass `-- --yes` (or `-- -y`) to skip the prompt, which is **required** without a TTY — the script refuses to run unconfirmed rather than proceeding.

## Project layout

```
src/
  index.ts              the entire request pipeline
  commands/
    index.ts            the commands array — the single registration point
    types.ts            the Command interface
    ping.ts aura.ts duel.ts sens.ts
  util/
    errorHandling.ts    errorReply — ephemeral failure messages
    math.ts             randInt(min, max), inclusive on both ends
    options.ts          getStringOption(options, name)
scripts/
  register.ts           PUTs the definitions to Discord (runs in Node, not workerd)
```

`src/index.ts` is the whole request pipeline: non-POST returns the liveness string, POST verifies the signature, answers `InteractionType.Ping` with a Pong, then looks the command up in `commandMap`. An unknown name gets an ephemeral `Unknown command`; anything that is not an `ApplicationCommand` falls through to a 400.

## Adding a command

One module plus one line:

1. Create `src/commands/<name>.ts` exporting a `Command` — a `definition` (what Discord registers) paired with a `handler` returning a `Promise<APIInteractionResponse>`.
2. Append it to the `commands` array in `src/commands/index.ts`. Nothing else discovers commands.
3. `npm run deploy` **and** `npm run register:guild`.

```ts
import { InteractionResponseType } from 'discord-api-types/v10';
import type { Command } from './types';

export const hello: Command = {
	definition: { name: 'hello', description: 'Say hello' },
	handler: async () => ({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: { content: 'Hello' },
	}),
};
```

Handlers are called with `(interaction, env, ctx)` and receive the broad `APIApplicationCommandInteraction`; existing commands narrow it with a local `const i = interaction as APIChatInputApplicationCommandInteraction` before touching `i.data.options`.

A few payload idioms worth knowing: the invoker is `interaction.member?.user ?? interaction.user` (`member` in a guild, `user` in DMs). Option values for user options are _IDs_ — the user object comes from `i.data.resolved.users[option.value]`. Options are found by matching both `name` and `type`.

## Design notes

**Cloudflare Workers rule out the usual discord.js model.** Workers are request-scoped and cannot hold a persistent WebSocket, so a Gateway connection is not available. The interaction-webhook model is what makes the Worker viable: Discord calls us, we answer, the request ends.

**Slash commands are the only option, not a preference.** Catching a prefix like `!duel` means listening for `MESSAGE_CREATE`, which needs both a Gateway connection and the `MESSAGE_CONTENT` privileged intent. Neither is available here. Slash commands also hand back typed, pre-validated options, so handlers never parse raw text.

**Ed25519 signature verification is the only trust boundary.** The Worker URL is public and unauthenticated, so every POST is verified with `verifyKey` against `DISCORD_PUBLIC_KEY` before anything else runs; a missing or invalid signature returns `401`. The raw body is read as **text first** — the signature covers the exact bytes, so parsing before verifying would break it. Never call `request.json()` ahead of verification.

**Stateless by construction.** No bindings, no storage, no persistent connection. `env` and `ctx` are threaded through to handlers but currently unused — they are the seam for the first command that needs a secret or `waitUntil`.

**One array feeds both consumers.** The `commands` array in `src/commands/index.ts` produces `commandMap` for runtime dispatch and supplies `scripts/register.ts` with the definitions PUT to Discord.

**Guild scope for development, global for release.** Guild registrations propagate instantly; global ones can take up to an hour. `developerOnly` is a _registration-time_ filter that holds a command out of the global PUT — which is why `/ping` exists in the test guild and nowhere else. It does not gate dispatch: a developer-only command still runs wherever it is already registered.

**Command failures are returned, not thrown.** Handlers return an ephemeral `errorReply` so the user gets a specific message; a thrown error would surface as "The application did not respond". The `try`/`catch` in `index.ts` is a backstop that logs and returns a generic reply, not the intended path.

**Mentions render but never ping.** Every message that interpolates a user sets `allowed_mentions: { parse: [], users: [] }`, so `<@id>` displays as a name without generating a notification. Content is assembled from user-supplied targets, so allow-nothing is the safe default.

**Data-driven commands keep their table as the single source.** In `sens`, one array (`SENS_PROFILES`) produces the registered `choices` list, the `SENS_MAP` lookup, and the reply text — a new character is one row. Two constraints come with that: Discord caps an option's choices at **25** (the list is currently at 16, and going past the cap fails the registration PUT rather than the deploy), and because the choice list lives in the `definition`, editing the table requires **re-registering**, not just deploying. A `String` option with `choices` still needs its value re-checked at runtime, which is why `sens` falls back to `errorReply` on a lookup miss — and the row with `value: 'all'` is load-bearing, since a bare `/sens` resolves `SENS_MAP.get(character ?? 'all')`.

## Verification

There is no test suite. After changing `src/` or `scripts/`, run:

```sh
npm run typecheck        # tsc --noEmit — covers src/ and scripts/
npm run format:check     # prettier --check .
```

Both are fast and both currently pass on a clean tree. To bundle without deploying:

```sh
npx wrangler deploy --dry-run --outdir .wrangler/dryrun
```

Use a _relative_ `--outdir` — an absolute Windows path gets joined onto the project root and fails.

`scripts/register.ts` runs in **Node**, not workerd (`tsx --env-file=.env`), and imports `src/commands/index` for real — so every command module is evaluated under Node at registration time. Keep module scope free of workerd-only globals, or `register:*` breaks even though the Worker deploys fine.

## Formatting

Prettier owns the whole tree — tabs, LF, single quotes, 140 columns, configured in `.prettierrc` and mirrored in `.editorconfig` for editors that read it.

```sh
npm run format           # write
npm run format:check     # verify, for CI or a pre-commit hook
```

The version is pinned exactly in `devDependencies`, so everyone gets identical output. `.prettierignore` excludes the generated `worker-configuration.d.ts`, npm-owned `package-lock.json`, and build directories. Don't hand-format — just run `npm run format`.
