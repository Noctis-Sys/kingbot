# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`kingbot` — a Discord bot that runs as a Cloudflare Worker. It is an _interaction webhook_, not a gateway bot: Discord POSTs slash-command interactions to the Worker's public URL and the Worker replies synchronously in the HTTP response. There is no persistent connection. The one piece of state is a D1 database (binding `DB`) holding `/charge` counts and the `/sens` hero roster and sensitivity values — see _D1_ below; every other command is a pure function of its interaction payload.

`AGENTS.md` holds the Cloudflare-specific guidance (docs links, error codes, product references). Read it before any Workers/KV/R2/D1/Durable Objects/Queues work rather than relying on recalled API knowledge.

## Commands

| Command                              | Purpose                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `npm run dev`                        | Local dev server (`wrangler dev`) on http://localhost:8787                                    |
| `npm run register:dev:guild`         | PUT the command definitions to the **dev** app's test guild (reads `.dev.vars`)               |
| `npm run register:dev:clear-guild`   | PUT `[]` to the dev app's test guild, removing its commands (reads `.dev.vars`; prompts)      |
| `npm run register:prod:guild`        | PUT the command definitions to the **prod** app's test guild (reads `.env`)                   |
| `npm run register:prod:global`       | PUT the definitions globally for the prod app, minus `developerOnly` ones (reads `.env`)      |
| `npm run register:prod:clear-guild`  | PUT `[]` to the prod app's test guild (reads `.env`; prompts to confirm)                      |
| `npm run register:prod:clear-global` | PUT `[]` globally for the prod app, removing every global command (reads `.env`; prompts)     |
| `npm run db:migrate:local`           | `wrangler d1 migrations apply DB --local` — apply pending migrations to the `wrangler dev` DB |
| `npm run db:migrate:remote`          | `wrangler d1 migrations apply DB --remote` — apply pending migrations to production D1        |
| `npm run deploy`                     | Deploy to Cloudflare                                                                          |
| `npm run cf-typegen`                 | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` **and `.dev.vars`**              |

There is deliberately no `register:dev:global` — the dev app is only ever registered to its test guild.

`package.json` declares `"engines": { "node": ">=20.6" }` — the floor for Node's `--env-file`, which every `register:*` script relies on via `tsx`.

Typecheck: `npm run typecheck` (`tsc --noEmit`, covers `src/` _and_ `scripts/`). It currently passes.
Bundle without deploying: `npx wrangler deploy --dry-run --outdir .wrangler/dryrun` (use a _relative_ outdir — an absolute Windows path gets joined onto the project root and fails).

There is **no test suite** — no `npm test`, nothing under `test/`. `npm run typecheck` and `npm run format:check` are the whole verification story; run both after changing `src/` or `scripts/`.

## Architecture

**One handler, one dispatch table.** `src/index.ts` is the whole request pipeline. First, a `GET` whose path is in the `routes` record is served _before_ signature verification: `/health` returns `"OK"`, and `/legal/terms-of-service` / `/legal/privacy-policy` proxy to the Pages site (see _Legal pages_). Every other request — including a `GET` to any other path; there is no liveness string any more — must carry a valid Ed25519 signature, checked with `verifyKey` against `env.DISCORD_PUBLIC_KEY` (401 on a missing or bad signature). Then: `InteractionType.Ping` gets a Pong; `ApplicationCommand` is looked up in `commandMap` (an unknown name returns an ephemeral `"Unknown command"` reply); `ApplicationCommandAutocomplete` is routed to that command's `autocomplete`, and returns an empty `choices` list when the command is unknown, has no `autocomplete`, or the `autocomplete` throws; anything else falls through to a 400. The raw body must be read as text _before_ parsing — `verifyKey` signs the exact bytes, so never `request.json()` first.

**`src/commands/index.ts` is the single registration point.** The `commands` array there (currently `[ping, duel, aura, sens, charge, chargeLeaderboard]`) feeds two consumers: `commandMap` (keyed on `definition.name`, used for runtime dispatch) and `scripts/register.ts` (the definitions PUT to Discord). Adding a command means creating the module and appending it to that array — nothing else discovers commands.

**The `Command` interface (`src/commands/types.ts`)** pairs a `definition` (`RESTPostAPIApplicationCommandsJSONBody`, what Discord registers) with a `handler` returning a `Promise<APIInteractionResponse>`, plus an optional `autocomplete(interaction, env, ctx)` taking an `APIApplicationCommandAutocompleteInteraction` and returning a `Promise<APIApplicationCommandAutocompleteResponse>` (currently only `sens` has one; the option itself must also set `autocomplete: true` in the `definition`). Handlers are called with `(interaction, env, ctx)` — `charge`, `chargeleaderboard`, and `sens` use `env` (for `env.DB`); nothing uses `ctx` yet, but it is the seam for `waitUntil`. Handlers receive the broad `APIApplicationCommandInteraction`; existing commands narrow it with a local `const i = interaction as APIChatInputApplicationCommandInteraction` before touching `i.data.options`. An optional `developerOnly: true` (currently on `ping`) holds the command back from global registration; it is a _registration-time_ filter only — `commandMap` still dispatches it wherever it is already registered.

**Interaction payload idioms.** The invoker is `interaction.member?.user ?? interaction.user` — `member` in a guild, `user` in DMs, so both must be checked. Option values for user options are _IDs_; the user object comes from `i.data.resolved.users[option.value]`. Options are found by matching both `name` and `type` — `aura`/`duel` inline a type predicate for their `User` option, while `sens` goes through `getStringOption` (`src/util/options.ts`) for its `String` one. In `autocomplete`, the typed-so-far text comes from `getAutocompleteOption`. Every message that mentions a user sets `allowed_mentions: { parse: [], users: [] }` so the bot renders `<@id>` without pinging.

**Failure replies go through `errorReply`** (`src/util/errorHandling.ts`), which produces an ephemeral message. Handlers return these instead of throwing — a thrown error would surface to the user as "The application did not respond". `index.ts` does wrap the dispatch in a `try`/`catch` that logs `[name] Error handling command:` and returns a generic `errorReply`, but that is a backstop, not the intended path.

**`sens` is D1-driven.** All data lives in three tables (migrations `0002`/`0003`, queried from `src/db/query.ts`):

- `hero_roster(slug PK, name UNIQUE)` — the heroes; `sens_data.slug` references it.
- `sens_data(slug, type, x_axis, y_axis, updated_at)` — PK `(slug, type)`, `type` CHECK-constrained to `'Controller'` | `'Mouse & Keyboard'`, axes stored as `TEXT`, `updated_at` Unix seconds or `NULL` when unknown.
- `global_sens_data(type PK, x_axis, y_axis, updated_at)` — the "All Heroes" row set.

A bare `/sens` — or a typed `All Heroes` (any case), since that name is not a `hero_roster` row — calls `getGlobalSensProfile` (rows labelled `'All Heroes'`). Otherwise the handler lowercases the argument and calls `getSensProfile`, which matches `r.slug = ?1` (a picked suggestion submits the slug) **or** `r.name = ?1 COLLATE NOCASE` (free-typed name). That query `LEFT JOIN`s `sens_data`, so a hero with no sens rows still returns one row with `type` `NULL`, rendered as "No sens data available…" plus a hint to try `/sens` or `/sens All Heroes`; zero rows (no such hero) goes to `errorReply`. **No fallback, by decision:** migration `0003`'s comment (and `0004`'s) describes `global_sens_data` as the default for heroes with a missing profile, but the maintainer chose _not_ to fall back — a hero without rows gets the message and hint, never the global values. Don't add a fallback. (The migration comments stay as they are — applied migrations are immutable.)

Autocomplete (`getRosterData`) runs `LIKE '%…%'` on `name` and `slug`, ranks exact > prefix > word-start (after a space or hyphen) > substring, then by name, `LIMIT 25` — Discord's cap on autocomplete choices. It is a full scan of the ~54-row `hero_roster` on **every keystroke**, which counts against the D1 rows-read quota. Changing heroes or sens values is a DB write (a new migration, or `wrangler d1 execute`), not a re-register — the definition carries no choice list.

**Shared helpers live in `src/util/`.** Besides `errorHandling.ts`: `math.ts` exports `randInt(min, max)` (inclusive on both ends), used by `aura` and `duel` for their rolls; `options.ts` exports `getStringOption(options, name)`, returning a `String` option's value **trimmed**, or `undefined`, and `getAutocompleteOption(options)`, returning the focused `String` option's trimmed value, or `''`. There is no user-option equivalent — `aura` and `duel` each still hand-roll that lookup.

## Shipping a command (two independent steps)

Deploying the Worker does **not** tell Discord the command exists. After changing any `definition`:

1. `npm run deploy` — ships the handler.
2. One of the `npm run register:*` scripts below — PUTs all definitions. The PUT is a full replace, so a command dropped from the `commands` array disappears from Discord.

`scripts/register.ts` **requires** the target scope as its one positional argument — there is no default. Which Discord app it targets is decided by the env file the npm script loads: `register:dev:*` run `tsx --env-file=.dev.vars` (dev app), `register:prod:*` run `tsx --env-file=.env` (prod app). Scopes:

- `guild` (`register:dev:guild`, `register:prod:guild`): PUTs to `DISCORD_TEST_GUILD_ID`. Instant — use this while developing.
- `global` (`register:prod:global` only): PUTs to every guild, **excluding** `developerOnly` commands; propagation can take up to an hour.
- `clear-guild` (`register:dev:clear-guild`, `register:prod:clear-guild`): PUTs `[]` to the test guild, removing its commands. Prompts to confirm, same as `clear-global` below.
- `clear-global` (`register:prod:clear-global` only): PUTs `[]` to the global scope, removing every global command. Prompts for confirmation on stdin; pass `-- --yes` (or `-- -y`) to skip the prompt, which is **required** without a TTY — it refuses to run rather than proceeding unconfirmed. Guild-scoped registrations are untouched.

`guild` and `clear-guild` **throw** when `DISCORD_TEST_GUILD_ID` is unset — there is no fallback to global. A missing or unrecognized scope throws listing the valid ones rather than picking a target — so a bare `npx tsx --env-file=.env scripts/register.ts` is safe and self-documenting.

Each scope is one entry in the `scopeHandlers` record, returning the `{ url, payload, summary }` for that scope — plus an optional `confirm` prompt, which is what marks a scope destructive enough to ask first. Adding a scope means adding it to `SCOPES` _and_ to that record — the `Record<Scope, …>` type makes a missing handler a compile error.

`scripts/register.ts` runs in **Node**, not workerd (`tsx --env-file=…`), which is why it reads `process.env` and why `scripts/` is in the root tsconfig's `include`. It imports `src/commands/index` for real, so every command module is evaluated under Node at registration time: keep module scope free of workerd-only globals, or `register:*` breaks even though the Worker deploys fine. (The `discord-api-types` runtime enums do resolve correctly under `tsx` — verified.)

## D1

`kingbot-db` is bound as `env.DB` (`wrangler.jsonc`). Schema lives in `migrations/` as numbered `.sql` files: `0001` charge counts, `0002` `hero_roster`, `0003` `sens_data` + `global_sens_data`, `0004` seeds the roster and the known sens values. Queries live in `src/db/`:

- `charges.ts` — `recordCharge` upserts `user_charges` and bumps the `'charge'` row in `counters` in one `batch`, which D1 runs as a transaction; `getChargeLeaderboard` reads the top N plus the total. `/chargeleaderboard` (`chargeLeaderboard.ts`) shows it and only reads, so viewing it never counts as a charge. Counts are per user across every server, so the leaderboard can list users from other servers, who render as unknown `<@id>` mentions.
- `query.ts` — the `/sens` reads: `getRosterData`, `getSensProfile`, `getGlobalSensProfile` (see _`sens` is D1-driven_).

**Migrations are not applied by the push-to-deploy build.** Apply them yourself — `npm run db:migrate:remote` — _before_ pushing code that depends on them, and `npm run db:migrate:local` for `wrangler dev`. **Never edit an applied migration** — not even its formatting; D1 tracks applied files by name and won't re-run them, so an edit just makes the file lie about the schema. Fix forward with a new numbered file. (`migrations/` is in `.prettierignore` for exactly this reason — Prettier used to rewrite applied migrations and mangle their comments.)

The account is on the Workers Free plan: 100,000 D1 row writes/day, and since 2026-09-01 queries **fail** once a daily limit is hit (until midnight UTC). A charge costs 2 row writes, and every index on a written column adds one more — which is why `user_charges.count` is unindexed. `charge` catches a failed `recordCharge` and still replies, just without the footer count; `sens` catches a failed read and returns an `errorReply` (and its autocomplete returns empty choices). Keep new D1 calls on a degrade-don't-throw path.

## Secrets

Two gitignored files hold the same four keys — `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, `DISCORD_TEST_GUILD_ID` — for two different Discord apps:

- `.dev.vars` — the **dev** app. Injected into workerd by `wrangler dev` (where `DISCORD_PUBLIC_KEY` is the one the Worker uses) and loaded by `register:dev:*`.
- `.env` — the **prod** app. Loaded by `register:prod:*`; only `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, and `DISCORD_TEST_GUILD_ID` are consumed there. The deployed Worker does not read it.

Templates for both are committed (`.env.example`, `.dev.vars.example`, whitelisted in `.gitignore`); copy each and fill in the matching app's values.

`wrangler types` derives the `Env` members from `.dev.vars` (they land in `__BaseEnv_Env`), so a var added there stays untyped until `npm run cf-typegen` is re-run. `wrangler.jsonc` declares no `vars`, so production values must be set with `wrangler secret put`.

## Legal pages

The Terms of Service and Privacy Policy are static HTML in `docs/` (`terms-of-service.html`, `privacy-policy.html`), hosted on Cloudflare Pages at https://kingbot-c36.pages.dev. The Worker proxies `GET /legal/terms-of-service` and `GET /legal/privacy-policy` to it (the `routes` record in `src/index.ts`), so the bot's own domain can serve them unsigned.

The `kingbot` Pages project is Git-connected to this repo, so pushing to `main` redeploys the legal pages alongside the Worker — editing `docs/` and pushing is enough.

## The tsconfig

`tsconfig.json` includes `src/**/*.ts` + `scripts/**/*.ts` + `worker-configuration.d.ts` with `types: ["./worker-configuration.d.ts", "node"]`. `Env` is ambient from `worker-configuration.d.ts`; it is never imported.

`noUnusedLocals` is on, so an unused import is a typecheck failure, and `strict` is on.

## Configuration notes

- `compatibility_flags: ["nodejs_compat"]` is on, so `node:*` imports are available.
- `observability` and `upload_source_maps` are enabled — logs and stack traces are usable in the Cloudflare dashboard.
- `wrangler.jsonc` ships with commented-out blocks for smart placement, vars, static assets, and service bindings; uncomment in place rather than re-deriving the syntax.
- Formatting is Prettier-owned across the whole tree: tabs / LF / single quotes / 140 columns (`.prettierrc`, mirrored in `.editorconfig`). Run `npm run format` to write and `npm run format:check` to verify; the version is pinned exactly so output is identical everywhere. `prettier-plugin-sql` (also pinned) formats `*.sql` as SQLite with uppercase keywords. `.prettierignore` excludes the generated `worker-configuration.d.ts`, `package-lock.json`, build dirs, and `migrations/` (see _D1_ — applied migrations are immutable). Don't hand-format or match a file's local style — just run the formatter.
