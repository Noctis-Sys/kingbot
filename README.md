# kingbot

A Discord bot that runs as a Cloudflare Worker.

It is an **interaction webhook**, not a Gateway bot. Discord POSTs each slash-command interaction to the Worker's public URL, and the Worker answers in the HTTP response. There is no persistent connection. The one piece of state is a D1 database (binding `DB`): `/charge` writes charge counts to it, and `/chargeleaderboard` and `/sens` read from it. Every other command is a pure function of its interaction payload.

## Commands

| Command              | Options                                      | What it does                                                                                                                    |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/ping`              | —                                            | Replies `Pong`. Developer-only, so it is never registered globally.                                                             |
| `/aura`              | `target` (user, optional)                    | Rolls an "aura" number from 1–1000 for you or someone else.                                                                     |
| `/duel`              | `target` (user, required)                    | Simulates a shootout between you and the target; the winner is a coin flip.                                                     |
| `/sens`              | `character` (string, autocomplete, optional) | Prints a Marvel Rivals sensitivity profile, read from D1. With no argument, returns the `All Heroes` profile.                   |
| `/charge`            | —                                            | Posts an embed of you charging into battle, with the global charge number in the footer. Each charge is counted per user in D1. |
| `/chargeleaderboard` | —                                            | Shows the top 10 chargers and the global charge total. Read-only — viewing it does not count as a charge.                       |

## Getting started

### Prerequisites

- Node.js 20.6+ and npm (the `register:*` scripts use Node's `--env-file` flag, added in 20.6)
- A Cloudflare account (`wrangler` prompts you to log in on first deploy)
- Two Discord applications — a **dev** app for local work and a **prod** app for the deployed bot — https://discord.com/developers/applications

### Install

```sh
npm install
```

### Secrets

The two gitignored env files belong to two different Discord applications. Copy the checked-in templates and fill in each app's values:

```sh
cp .dev.vars.example .dev.vars   # the DEV app
cp .env.example .env             # the PROD app
```

Both templates carry the same four keys:

```
DISCORD_PUBLIC_KEY="discord_public_key_here"
DISCORD_APPLICATION_ID="discord_application_id_here"
DISCORD_TOKEN="discord_token_here"
DISCORD_TEST_GUILD_ID="discord_test_guild_id_here"
```

- **`.dev.vars`** — the **dev** app's credentials. It is read twice: `wrangler dev` injects it into the local Worker, which uses `DISCORD_PUBLIC_KEY` for signature verification, and Node reads it for the `register:dev:*` scripts, which use `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, and `DISCORD_TEST_GUILD_ID`.
- **`.env`** — the **prod** app's credentials, read by Node for the `register:prod:*` scripts.

Find all four in the Discord Developer Portal: the public key and application ID under **General Information**, the token under **Bot**, and the test guild ID by right-clicking your server with Developer Mode on.

`wrangler types` derives the `Env` type from `.dev.vars`, so after adding a var there run `npm run cf-typegen` to make it visible to TypeScript. For production, set values with `wrangler secret put <NAME>` — `wrangler.jsonc` declares no `vars`. The deployed Worker's `DISCORD_PUBLIC_KEY` must be the prod app's.

### Run it

```sh
npm run db:migrate:local   # first run, and after pulling new migrations — see Database
npm run dev                # wrangler dev on http://localhost:8787
```

`GET /health` returns `OK`, and `GET /legal/*` serves the legal pages (see [Legal](#legal)). Any other request without a valid Discord signature gets a `401`.

Discord has to be able to reach the endpoint, so point a public tunnel at it (e.g. `cloudflared tunnel --url http://localhost:8787`) and paste that URL into the dev app's **Interactions Endpoint URL** in the Discord Developer Portal. Discord probes the endpoint when you save it, including with a deliberately bad signature, and rejects it unless the Worker fails that request correctly.

Then register the commands to your test guild so they show up:

```sh
npm run register:dev:guild
```

If the commands are not immediately present, reload Discord (`ctrl+r` in both the desktop app and the web client) to surface them.

## Database

The D1 database `kingbot-db` is bound as `env.DB` (`wrangler.jsonc`). Its schema and seed data live in `migrations/` as numbered `.sql` files:

| Migration                | Contents                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `0001_charge_counts.sql` | `counters` and `user_charges` — the `/charge` counts       |
| `0002_hero_roster.sql`   | `hero_roster` — hero slugs and display names               |
| `0003_sens_table.sql`    | `sens_data` (per hero) and `global_sens_data` (All Heroes) |
| `0004_seed_data.sql`     | Seed rows for the roster and sens tables                   |

Apply migrations yourself — the push-to-deploy build does **not** run them:

```sh
npm run db:migrate:local    # the local database used by `npm run dev`
npm run db:migrate:remote   # production — run BEFORE deploying code that depends on a new migration
```

To change sens values or the roster, add a **new** migration (never edit one that has already been applied) or write directly with `npx wrangler d1 execute`. The data is read at request time, so no re-registering or redeploy is needed.

## Deploying and registering are independent steps

Shipping the Worker updates the _handler_. It does not tell Discord the command _exists_. After changing any `definition` you need both:

```sh
npm run deploy                # ships the handler
npm run register:prod:global  # PUTs the definitions to Discord
```

The registration PUT is a **full replace**: a command dropped from the `commands` array disappears from Discord on the next run.

Each script picks its Discord app by the env file it loads: `register:dev:*` read `.dev.vars` (the dev app), `register:prod:*` read `.env` (the prod app). The script prints the target application ID before doing anything. There is deliberately no `register:dev:global` — the dev app only ever registers to the test guild.

`scripts/register.ts` requires the scope as its one positional argument — there is no default, and an unrecognized scope throws listing the valid ones rather than guessing a target, since a wrong guess here is destructive.

| Script                               | Env file    | Scope          | Effect                                                                                                    |
| ------------------------------------ | ----------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run register:dev:guild`         | `.dev.vars` | `guild`        | PUTs every command to the dev app's `DISCORD_TEST_GUILD_ID`. Instant — use this while developing.         |
| `npm run register:dev:clear-guild`   | `.dev.vars` | `clear-guild`  | PUTs `[]` to the dev app's test guild, removing its commands. Prompts to confirm.                         |
| `npm run register:prod:guild`        | `.env`      | `guild`        | PUTs every command to the prod app's `DISCORD_TEST_GUILD_ID`. Instant.                                    |
| `npm run register:prod:global`       | `.env`      | `global`       | PUTs to every guild, **excluding** `developerOnly` commands. Propagation can take up to an hour.          |
| `npm run register:prod:clear-guild`  | `.env`      | `clear-guild`  | PUTs `[]` to the prod app's test guild, removing its commands. Prompts to confirm.                        |
| `npm run register:prod:clear-global` | `.env`      | `clear-global` | PUTs `[]` globally, removing every global command. Prompts to confirm; guild registrations are untouched. |

`guild` and `clear-guild` throw when `DISCORD_TEST_GUILD_ID` is unset — there is no fallback to global. The clearing scopes prompt on stdin; pass `-- --yes` (or `-- -y`) to skip the prompt, which is **required** without a TTY — the script refuses to run unconfirmed rather than proceeding.

Other scripts:

| Script                      | Effect                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`               | `wrangler dev` on http://localhost:8787                                      |
| `npm run deploy`            | Deploy the Worker to Cloudflare                                              |
| `npm run db:migrate:local`  | `wrangler d1 migrations apply DB --local`                                    |
| `npm run db:migrate:remote` | `wrangler d1 migrations apply DB --remote`                                   |
| `npm run cf-typegen`        | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` and `.dev.vars` |
| `npm run typecheck`         | `tsc --noEmit` over `src/` and `scripts/`                                    |
| `npm run format`            | Prettier, write (`format:check` to verify)                                   |

## Legal

The Worker serves the bot's legal pages, for the **Terms of Service URL** and **Privacy Policy URL** fields in the Discord Developer Portal:

- `GET /legal/terms-of-service`
- `GET /legal/privacy-policy`

Both proxy the pages hosted on the Cloudflare Pages site `https://kingbot-c36.pages.dev` (`/terms-of-service` and `/privacy-policy`). Their sources are `docs/terms-of-service.html` and `docs/privacy-policy.html`.

## Project layout

```
src/
  index.ts                the entire request pipeline
  commands/
    index.ts              the commands array — the single registration point
    types.ts              the Command interface
    ping.ts aura.ts duel.ts sens.ts
    charge.ts             /charge — embed + recordCharge
    chargeLeaderboard.ts  /chargeleaderboard — read-only top 10
  db/
    charges.ts            recordCharge, getChargeLeaderboard
    query.ts              sens and hero-roster queries
  util/
    errorHandling.ts      errorReply — ephemeral failure messages
    math.ts               randInt(min, max), inclusive on both ends
    options.ts            getStringOption(options, name), getAutocompleteOption(options)
scripts/
  register.ts             PUTs the definitions to Discord (runs in Node, not workerd)
migrations/               numbered D1 schema + seed .sql files
docs/                     legal page sources (terms-of-service.html, privacy-policy.html)
```

`src/index.ts` is the whole request pipeline:

1. **GET routes** — `/health`, `/legal/terms-of-service`, `/legal/privacy-policy` — are matched first and served without a signature check.
2. Everything else has its Ed25519 signature verified; a missing or invalid signature returns `401`.
3. `InteractionType.Ping` gets a Pong.
4. `ApplicationCommand` is dispatched to the command's `handler` via `commandMap`. An unknown name gets an ephemeral `Unknown command`.
5. `ApplicationCommandAutocomplete` is dispatched to the command's `autocomplete` handler. A missing command, a command without `autocomplete`, or a thrown error all return an empty `choices` list.
6. Anything else falls through to a `400`.

## Adding a command

One module plus one line:

1. Create `src/commands/<name>.ts` exporting a `Command` — a `definition` (what Discord registers) paired with a `handler` returning a `Promise<APIInteractionResponse>`. Optionally add an `autocomplete` handler (for options declared with `autocomplete: true`) and `developerOnly: true` to keep it out of global registration.
2. Append it to the `commands` array in `src/commands/index.ts`. Nothing else discovers commands.
3. `npm run deploy` **and** `npm run register:dev:guild` (or the `register:prod:*` equivalent).

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

Handlers are called with `(interaction, env, ctx)` and receive the broad `APIApplicationCommandInteraction`; existing commands narrow it with a local `const i = interaction as APIChatInputApplicationCommandInteraction` before touching `i.data.options`. A handler that needs storage uses `env.DB` (see `charge.ts` and `src/db/`); `ctx` is the seam for `waitUntil`.

A few payload idioms worth knowing: the invoker is `interaction.member?.user ?? interaction.user` (`member` in a guild, `user` in DMs). Option values for user options are _IDs_ — the user object comes from `i.data.resolved.users[option.value]`. Options are found by matching both `name` and `type`.

## Design notes

**Cloudflare Workers rule out the usual discord.js model.** Workers are request-scoped and cannot hold a persistent WebSocket, so a Gateway connection is not available. The interaction-webhook model is what makes the Worker viable: Discord calls us, we answer, the request ends.

**Slash commands are the only option, not a preference.** Catching a prefix like `!duel` means listening for `MESSAGE_CREATE`, which needs both a Gateway connection and the `MESSAGE_CONTENT` privileged intent. Neither is available here. Slash commands also hand back typed, pre-validated options, so handlers never parse raw text.

**Ed25519 signature verification is the only trust boundary for interactions.** The Worker URL is public and unauthenticated, so every interaction POST is verified with `verifyKey` against `DISCORD_PUBLIC_KEY` before anything else runs; a missing or invalid signature returns `401`. The only exceptions are the fixed GET routes (`/health`, `/legal/*`), which are matched before verification and touch no interaction data. The raw body is read as **text first** — the signature covers the exact bytes, so parsing before verifying would break it. Never call `request.json()` ahead of verification.

**D1 is the only state, and it degrades rather than fails.** Charge counts are stored per Discord user across every server and DM, so the leaderboard can list users from other servers (they render as unknown `<@id>` mentions). The account is on the Workers Free plan — 100,000 D1 row writes/day, and queries fail once a daily limit is hit until midnight UTC. A charge costs 2 row writes, and every index on a written column would add one more, which is why `user_charges.count` is unindexed. D1 calls are wrapped so a failure degrades the reply instead of breaking it: if `recordCharge` fails, `/charge` still replies, just without the footer count. Keep new D1 calls on that path.

**One array feeds both consumers.** The `commands` array in `src/commands/index.ts` produces `commandMap` for runtime dispatch and supplies `scripts/register.ts` with the definitions PUT to Discord.

**Guild scope for development, global for release.** Guild registrations propagate instantly; global ones can take up to an hour. `developerOnly` is a _registration-time_ filter that holds a command out of the global PUT — which is why `/ping` exists in the test guild and nowhere else. It does not gate dispatch: a developer-only command still runs wherever it is already registered.

**Command failures are returned, not thrown.** Handlers return an ephemeral `errorReply` so the user gets a specific message; a thrown error would surface as "The application did not respond". The `try`/`catch` in `index.ts` is a backstop that logs and returns a generic reply, not the intended path.

**Mentions render but never ping.** Every message that interpolates a user sets `allowed_mentions: { parse: [], users: [] }`, so `<@id>` displays as a name without generating a notification. Content is assembled from user-supplied targets, so allow-nothing is the safe default.

**`/sens` data lives in the database, not the definition.** Heroes are in `hero_roster`, per-hero values in `sens_data`, and the All Heroes profile in `global_sens_data`. The `character` option uses autocomplete instead of a fixed `choices` list: suggestions match the typed text against hero name or slug, capped at `LIMIT 25` to match Discord's limit on autocomplete results. The handler accepts either a picked suggestion (a slug) or a freely typed hero name, matched case-insensitively; typing `All Heroes` gives the same global profile as a bare `/sens`. An unknown hero gets an `errorReply`, and a known hero with no `sens_data` rows shows "No sens data available for this character." with a hint to try `/sens` or `/sens All Heroes` — it deliberately does not fall back to the global values. Because the option definition never lists the heroes, editing the data is a database write (see [Database](#database)) — not a re-register.

## Verification

There is no test suite. After changing `src/` or `scripts/`, run:

```sh
npm run typecheck        # tsc --noEmit — covers src/ and scripts/
npm run format:check     # prettier --check .
```

Both are fast. To bundle without deploying:

```sh
npx wrangler deploy --dry-run --outdir .wrangler/dryrun
```

Use a _relative_ `--outdir` — an absolute Windows path gets joined onto the project root and fails.

`scripts/register.ts` runs in **Node**, not workerd — via `tsx --env-file=.dev.vars` for the `register:dev:*` scripts or `tsx --env-file=.env` for `register:prod:*` — and imports `src/commands/index` for real, so every command module is evaluated under Node at registration time. Keep module scope free of workerd-only globals, or `register:*` breaks even though the Worker deploys fine.

## Formatting

Prettier owns the whole tree — tabs, LF, single quotes, 140 columns, configured in `.prettierrc` and mirrored in `.editorconfig` for editors that read it.

```sh
npm run format           # write
npm run format:check     # verify, for CI or a pre-commit hook
```

The version is pinned exactly in `devDependencies`, so everyone gets identical output. `.prettierignore` excludes the generated `worker-configuration.d.ts`, npm-owned `package-lock.json`, build directories, and `migrations/` (applied migrations are immutable — see [Database](#database)). Don't hand-format — just run `npm run format`.
