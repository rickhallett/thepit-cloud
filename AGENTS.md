# Agent's Orders

This file is the boot contract for agents working in this repo.
It is a layered boot sequence [SD-331]:

- **Layer 0 (kernel)** and **Layer 1 (machinery manifest)** load every session.
- **Layer 2 (campaign overlay)** is injected at session start from
  `docs/internal/campaign/active.md`. Dormant by default.
- **Layer 3 (reference modules)** is read on demand only.

Orientation lives in this file; enforcement lives in hooks and scripts.
If a rule matters, something with an exit code backs it.

## Layer 0: Kernel

### True North

- **Primary objective:** get hired - proof over claims [SD-309]
- **Override:** truth over hiring signal [SD-134]

If proof and spin conflict, choose truth.

### Boot Rules

These apply in every session unless the Operator explicitly overrides them.

- Write decisions to durable files, not context only [SD-266]
- Historical records are append-only; do not rewrite the chain [SD-266]
- Estimates use agent-minutes, not human-speed guesses [SD-268]
- Change is ready only when the gate is green
- Open every address to the Operator with a one-line readback of the order as
  understood [SD-315]. When a campaign is active, open with the campaign HUD
  instead [SD-331]
- Use `printf`, never `echo`, when piping literal values to the CLI
- Python uses `uv` exclusively [SD-310]
- New tasks go through `backlog add "title" --priority P [--epic E] [--tag T]`
- Notable events append to `docs/internal/events.yaml`
- Development costs append to `docs/internal/dev-cost-ledger.yaml` per PR or session
- Commendations append to `docs/internal/weaver/commendations.log`
- Bad output means diagnose, reset, and rerun. Do not patch around unknown causes
- One action = one instruction set = one agent
- Weigh marginal value against cost before dispatching extra review or agent rounds
- No em dashes, ever [SD-319]
- No emojis, ever [SD-319]
- No interactive git commands
- No `git stash`, ever [SD-325]
- End the session with no unpushed commits

### Engineering Loop

**Read -> Verify -> Write -> Execute -> Confirm**

- Do not infer what you can verify
- Keep commits atomic
- Spec or plan before implementation
- Human review happens after execution, not during, unless the task is taste-bound

## Layer 1: Machinery Manifest

Enforcement inventory. Gates and hooks are hard barriers; everything else in
this layer is convention that agents must follow but nothing blocks.

### Work Tracking

Use the backlog CLI instead of editing YAML directly.

```bash
backlog
backlog add "title" -p high
backlog list -s open
backlog show BL-001
backlog edit BL-001 -s blocked -r "reason"
backlog close BL-001 -r "reason"
```

Data lives in `docs/internal/backlog.yaml`.

### GitHub Workflow

GitHub Issues and PRs are the external record of engineering discipline.

#### Issues

- External-facing work gets a GitHub issue
- Issue bodies include: problem, acceptance criteria, scope boundary
- Estimates use complexity and risk, never time
- Labels: `feature`, `bug`, `refactor`, `chore`, `tech-debt`, `infra`, `portfolio`, `research`, `platform`, `community`, `blocked`, `needs-audit`

#### Branches

- Never commit directly to `main`
- Branches use `feat/`, `fix/`, `refactor/`, `chore/`
- Branch names include the issue number, for example `feat/42-custom-arena-builder`
- Default to `git worktree` for parallel work

Example:

```bash
git worktree add -b feat/42-arena-builder ../thepit-42-arena-builder main
```

#### PRs

- 1 PR = 1 concern
- Squash merge to keep history clean
- PR description is written for an external reader
- Include what changed, why, what was tested, and follow-up limits
- Add screenshots or GIFs for UI changes
- Review attestation belongs in the PR body or comments

#### Sequence

```text
issue -> worktree -> develop -> gate -> PR -> review -> squash merge -> post-merge verify -> close issue -> remove worktree
```

### Deployment

- Git-triggered deployments are **disabled** on Vercel (burns server budget)
- Deploy manually with `vercel --prod` from the CLI
- Set env vars with `printf 'value' | vercel env add NAME production --force`
- Never use `echo` for piping env values (use `printf`)

### Gate

The gate is survival, not optimisation.

```bash
pnpm run test:ci
```

If the gate fails, the change is not ready.

### Pitcommit

Invocation:

```bash
python3 scripts/pitcommit.py <command>
```

Core commands:

```bash
pitcommit status
pitcommit tier --set <full|docs|wip|sudo>
pitcommit attest <step> [--tree H] [--verdict V] [--log P]
pitcommit verify
pitcommit invalidate
pitcommit trailer
sudo pitcommit walkthrough
```

Required tiers:

- `full`: `gate`, `dc-claude`, `dc-openai`, `pitkeel`, `walkthrough`
- `docs`: `gate`, `pitkeel`
- `wip`: `gate`, `pitkeel`
- `sudo`: `gate`

Typical flow:

1. Stage changes
2. Set tier if needed
3. Run `just gauntlet` or the relevant review target
4. Run walkthrough when required
5. Commit with `git commit -m "..."`

Key behavior:

- Attestations are tied to the staged tree hash
- If staged content changes, attestations go stale
- `.gauntlet/` is ephemeral and gitignored
- `--no-verify` is emergency-only

### Conventions

- TypeScript, Next.js 16, Tailwind, Drizzle ORM, Neon Postgres
- Tests live under `tests/`
- Use JSDoc for behavior and short header comments for file purpose when needed
- YAML is the default structured-data format [SD-258]
- Use 2-space indentation

### Filesystem Map

Read depth 1 every session. Read deeper only when relevant.

```text
/                       repo root
|- AGENTS.md            boot contract
|- CLAUDE.md            symlink to AGENTS.md
|- justfile             automation targets
|- package.json         scripts and dependencies
|- app/                 Next.js app router
|- lib/                 source code
|- components/          React components
|- shared/              shared types and utilities
|- db/                  schema and database config
|- drizzle/             migrations
|- tests/               unit, integration, API, e2e
|- scripts/             pitcommit and review tooling
|- bin/                 CLI tools
|- docs/                specs, decisions, internal docs
|  |- decisions/        session-scoped decision files
|  |- internal/         operational references and logs
|  |  |- campaign/      campaign overlay: active.md + archive/
|- .github/workflows/   CI
```

BFS rule [SD-195]:

- Depth 1: every session
- Depth 2: when topic-relevant
- Depth 3+: deliberate research only
- Read `docs/internal/session-decisions-index.yaml`, not the full chain, for orientation

## Layer 2: Campaign Overlay

A campaign is a deliberately adopted operating frame (register, roles,
vocabulary, HUD) scoped to a sustained push, then distilled and retired.
The naval frame (2026-02-24 to 2026-03-10) was the first instance.

- `docs/internal/campaign/active.md` is the only file this layer loads.
  A SessionStart hook injects it (`.claude/settings.local.json`; `.claude/`
  is dark and stays untracked, so the hook is per-machine config). Agents
  without the hook read `active.md` at boot.
- Dormant state: plain register, no HUD beyond the one-line readback.
- Active state: the frame defines register, roles, vocabulary, and the HUD
  spec. HUD fields derive from real state where possible; do not invent them.
- Lifecycle: adopt -> industrialize -> distill -> retire. Retirement criteria
  are fixed at adoption. See `docs/internal/campaign/README.md`.
- Precedence: the Operator's fluency protocol governs whether AI acts; this
  contract governs how agents work; the campaign governs voice. A campaign
  register never overrides enforcement or the fluency protocol [SD-331].
- Archived campaigns live in `docs/internal/campaign/archive/` with their
  frame, distillation, and retro. The archive is append-only [SD-266].

## Layer 3: Reference Modules

Not part of the first-pass boot load. Read only when needed.

### Recent Orientation

Standing:

- SD-134 truth first
- SD-266 immutable chain
- SD-268 agentic estimation
- SD-278 pilot over
- SD-297 forward-ref decision collisions
- SD-309 hired = proof > claim
- SD-310 `uv` only
- SD-315 readback before acting
- SD-318 darkcat alley
- SD-319 no em dashes, no emojis
- SD-325 no stash
- SD-326 discipline beats swarm
- SD-328 tech-debt exposure through layered review
- SD-329 slopodar superseded by product failure taxonomy (supersedes SD-286 boot read)
- SD-330 run pipeline abandoned; core product refocus
- SD-331 layered boot with campaign overlay

Use `docs/internal/session-decisions-index.yaml` for current summaries.

### Modules

- `docs/internal/session-decisions-index.yaml` - current standing orders and recent decisions
- `docs/deep-archive/2026-03-27-roadmap-sweep/docs/internal/session-decisions.md` - full historical chain and provenance
- `docs/deep-archive/2026-03-27-roadmap-sweep/docs/internal/lexicon.md` - full vocabulary (v0.27, distilled)
- `docs/deep-archive/2026-03-27-roadmap-sweep/docs/internal/layer-model.md` - full operational model (L0-L12)
- `docs/internal/slopodar.yaml` - anti-pattern taxonomy (historical; see SD-329)
- `docs/internal/weaver/` - adversarial review materials
- `docs/internal/campaign/archive/` - retired campaign frames and retros
- `.claude/agents/*.md` - role-specific instructions

## What This File Is Not

This file is not the full theory of operation, not the anti-slop prompt, and not the project narrative.
It is the minimum contract required to start work correctly.
