# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`kingbot` — a Discord bot that runs as a Cloudflare Worker. It is an *interaction webhook*, not a gateway bot: Discord POSTs slash-command interactions to the Worker's public URL and the Worker replies synchronously in the HTTP response. There is no persistent connection, no bindings, and no state — every command is a pure function of its interaction payload.

`AGENTS.md` holds the Cloudflare-specific guidance (docs links, error codes, product references). Read it before any Workers/KV/R2/D1/Durable Objects/Queues work rather than relying on recalled API knowledge.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (`wrangler dev`) on http://localhost:8787 |
| `npm run register:guild` | PUT the command definitions to the test guild (see *Shipping a command*) |
| `npm run register:global` | Same PUT, but to the global scope |
| `npm run register:clear-guild` | PUT an empty array to the test guild, removing its commands (prompts to confirm) |
| `npm run register:clear-global` | PUT an empty array globally, removing every global command (prompts to confirm) |
| `npm test` | Vitest in watch mode; `npx vitest run` for a single pass |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` **and `.dev.vars`** |

Single test file / single case: `npx vitest run test/index.spec.ts -t "responds with Hello World"`.
Typecheck: `npx tsc --noEmit` (covers `src/` *and* `scripts/`) and `npx tsc -p test/tsconfig.json --noEmit` (tests). Neither is wired to an npm script; both currently pass.
Bundle without deploying: `npx wrangler deploy --dry-run --outdir .wrangler/dryrun` (use a *relative* outdir — an absolute Windows path gets joined onto the project root and fails).

## Architecture

**One handler, one dispatch table.** `src/index.ts` is the whole request pipeline: non-POST returns the liveness string `"Kingbot is running!"`; POST verifies the Ed25519 signature with `verifyKey` against `env.DISCORD_PUBLIC_KEY` (401 on a missing or bad signature), answers `InteractionType.Ping` with a Pong, then looks the command up in `commandMap`. An unknown name returns an ephemeral `"Unknown command"` reply; anything that is not `ApplicationCommand` falls through to a 400. The raw body must be read as text *before* parsing — `verifyKey` signs the exact bytes, so never `request.json()` first.

**`src/commands/index.ts` is the single registration point.** The `commands` array there (currently `[ping, duel, aura, sens]`) feeds two consumers: `commandMap` (keyed on `definition.name`, used for runtime dispatch) and `scripts/register.ts` (the definitions PUT to Discord). Adding a command means creating the module and appending it to that array — nothing else discovers commands.

**The `Command` interface (`src/commands/types.ts`)** pairs a `definition` (`RESTPostAPIApplicationCommandsJSONBody`, what Discord registers) with a `handler` returning an `APIInteractionResponse`. Handlers are called with `(interaction, env, ctx)` — no current command uses `env` or `ctx`, but they are threaded through and are the seam for anything needing secrets or `waitUntil`. Handlers receive the broad `APIApplicationCommandInteraction`; existing commands narrow it with a local `const i = interaction as APIChatInputApplicationCommandInteraction` before touching `i.data.options`. An optional `developerOnly: true` (currently on `ping`) holds the command back from global registration; it is a *registration-time* filter only — `commandMap` still dispatches it wherever it is already registered.

**Interaction payload idioms.** The invoker is `interaction.member?.user ?? interaction.user` — `member` in a guild, `user` in DMs, so both must be checked. Option values for user options are *IDs*; the user object comes from `i.data.resolved.users[option.value]`. Options are found by matching both `name` and `type` — `aura`/`duel` inline a type predicate for their `User` option, while `sens` goes through `getStringOption` (`src/util/options.ts`) for its `String` one. A `String` option with a `choices` list still needs its value re-checked at runtime: `sens` looks the choice up in a `Map` and falls back to `errorReply` when it misses. Every message that mentions a user sets `allowed_mentions: { parse: [], users: [] }` so the bot renders `<@id>` without pinging.

**Failure replies go through `errorReply`** (`src/util/errorHandling.ts`), which produces an ephemeral message. Handlers return these instead of throwing — a thrown error would surface to the user as "The application did not respond". `index.ts` does wrap the dispatch in a `try`/`catch` that logs `[name] Error handling command:` and returns a generic `errorReply`, but that is a backstop, not the intended path.

**Shared helpers live in `src/util/`.** Besides `errorHandling.ts`: `math.ts` exports `randInt(min, max)` (inclusive on both ends), used by `aura` and `duel` for their rolls; `options.ts` exports `getStringOption(options, name)`, returning a `String` option value or `undefined`. There is no user-option equivalent — `aura` and `duel` each still hand-roll that lookup.

## Shipping a command (two independent steps)

Deploying the Worker does **not** tell Discord the command exists. After changing any `definition`:

1. `npm run deploy` — ships the handler.
2. One of the `npm run register:*` scripts below — PUTs all definitions. The PUT is a full replace, so a command dropped from the `commands` array disappears from Discord.

`scripts/register.ts` **requires** the target scope as its one positional argument — there is no default. Each npm script passes one:

- `npm run register:guild` → scope `guild`: PUTs to `DISCORD_TEST_GUILD_ID`. Instant — use this while developing.
- `npm run register:global` → scope `global`: PUTs to every guild, **excluding** `developerOnly` commands; propagation can take up to an hour.
- `npm run register:clear-guild` → scope `clear-guild`: PUTs `[]` to the test guild, removing its commands. Prompts to confirm, same as `clear-global` below.
- `npm run register:clear-global` → scope `clear-global`: PUTs `[]` to the global scope, removing every global command. Prompts for confirmation on stdin; pass `-- --yes` (or `-- -y`) to skip the prompt, which is **required** without a TTY — it refuses to run rather than proceeding unconfirmed. Guild-scoped registrations are untouched.

`guild` and `clear-guild` **throw** when `DISCORD_TEST_GUILD_ID` is unset — there is no fallback to global. A missing or unrecognized scope throws listing the valid ones rather than picking a target — so a bare `npx tsx --env-file=.env scripts/register.ts` is safe and self-documenting.

Each scope is one entry in the `scopeHandlers` record, returning the `{ url, payload, summary }` for that scope — plus an optional `confirm` prompt, which is what marks a scope destructive enough to ask first. Adding a scope means adding it to `SCOPES` *and* to that record — the `Record<Scope, …>` type makes a missing handler a compile error.

`scripts/register.ts` runs in **Node**, not workerd (`tsx --env-file=.env`), which is why it reads `process.env` and why `scripts/` is in the root tsconfig's `include`.

## Secrets

Two gitignored files hold the same four keys — `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, `DISCORD_TEST_GUILD_ID` — for two different runtimes:

- `.env` — read by Node for the `register:*` scripts; only `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, and `DISCORD_TEST_GUILD_ID` are actually consumed there.
- `.dev.vars` — injected into workerd by `wrangler dev` and by the vitest pool. `DISCORD_PUBLIC_KEY` is the one the Worker itself uses.

`.gitignore` whitelists `.env.example` and `.dev.vars.example`, but neither template exists in the tree — a fresh checkout has to be given both files by hand.

`wrangler types` derives the `Env` members from `.dev.vars` (they land in `__BaseEnv_Env`), so a var added there stays untyped until `npm run cf-typegen` is re-run. `wrangler.jsonc` declares no `vars`, so production values must be set with `wrangler secret put`.

## Known-broken: the test suite

`npx vitest run` currently fails, for two separate reasons:

1. `test/index.spec.ts` is still the untouched scaffold asserting `"Hello World!"`; the Worker now answers `"Kingbot is running!"` to GET.
2. More fundamentally, the suite fails to even *import*. `discord-api-types/v10` has separate `require`/`import` export conditions; inside the vitest workers pool it resolves to the CJS build (`v10.js`), where the runtime enums arrive as `undefined`. `aura.ts`, `duel.ts`, and `sens.ts` read `ApplicationCommandOptionType` at module scope for their option `type`, so importing `src/index.ts` throws `TypeError: Cannot read properties of undefined (reading 'User')` before any test runs. (`options.ts` reads the same enum, but inside a function body, so it only blows up when called.)

This affects tests only, and **neither tsconfig catches it** — both `tsc` invocations pass, because the types resolve from `v10.d.ts` regardless of which runtime build gets loaded. `wrangler dev` and `wrangler deploy` bundle with esbuild, which takes the `import` condition (`v10.mjs`) and inlines the enum correctly — the dry-run build succeeds. Type-only imports are unaffected since they are erased. Fixing the suite means resolving that condition mismatch (or not evaluating the enum at module scope), not just refreshing the snapshots.

## Test conventions (from the scaffold)

`vitest.config.mts` points `@cloudflare/vitest-pool-workers` at `wrangler.jsonc` via the `cloudflareTest` plugin, so tests run in the real runtime with production compatibility flags and the `.dev.vars` secrets. Both styles are demonstrated: *unit* — `worker.fetch(request, env, ctx)` with `createExecutionContext()`, then `await waitOnExecutionContext(ctx)` before asserting; *integration* — `SELF.fetch(...)` through the full pipeline. Assertions use `toMatchInlineSnapshot`; refresh with `npx vitest run -u`.

Note that testing a real command means constructing a **signed** POST body, since `index.ts` verifies before dispatching — or calling `command.handler()` directly and bypassing the Worker. Commands that call `randInt`/`Math.random` need it stubbed before their output can be snapshotted.

## Two tsconfigs, different type universes

The root config includes `src/**/*.ts` + `scripts/**/*.ts` + `worker-configuration.d.ts` with `types: ["./worker-configuration.d.ts", "node"]`, and excludes `test/`. `test/tsconfig.json` extends it but swaps `types` to `["@cloudflare/vitest-pool-workers/types"]` — that is what makes `cloudflare:test` resolve. It is only consulted by `tsc` and the editor; the vitest pool does its own module resolution, which is why the two disagree (see above). `Env` is ambient from `worker-configuration.d.ts`; it is never imported.

`noUnusedLocals` is on, so an unused import is a typecheck failure, and `strict` is on.

## Configuration notes

- `compatibility_flags: ["nodejs_compat"]` is on, so `node:*` imports are available.
- `observability` and `upload_source_maps` are enabled — logs and stack traces are usable in the Cloudflare dashboard.
- `wrangler.jsonc` ships with commented-out blocks for smart placement, vars, static assets, and service bindings; uncomment in place rather than re-deriving the syntax.
- Formatting is nominally tabs / LF / single quotes / 140 columns (`.prettierrc`, `.editorconfig`), but the tree is inconsistent: `index.ts`, `ping.ts`, `types.ts`, `sens.ts`, `options.ts`, `register.ts`, and the test file use tabs, while `aura.ts`, `duel.ts`, `errorHandling.ts`, and `math.ts` use 4 spaces. There is no format or lint script — match the surrounding file rather than reformatting it.
