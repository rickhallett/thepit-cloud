# Campaign: Naval Frame

Retroactively archived 2026-07-04 [SD-331]. This campaign predates the
campaign overlay structure; the record below is reconstructed from the chain,
the lexicon, and the narrative layer. Canonical artifacts are linked, not
copied [SD-266].

## Span

- **Adopted:** 2026-02-24 [SD-120], catalysed by watching Master and Commander
  with the Captain's father. "Naval engineering metaphor recognised as
  self-organising scaffold."
- **Retired:** 2026-03-10, commit 668c23b ("Captain -> Operator"): "The naval
  metaphor was scaffolding. The principles are substrate-neutral."

## Objective

Govern one accountable human directing semi-autonomous, non-deterministic
agents through a month of verification-heavy solo development, before the
field had vocabulary for that relationship.

## Frame

- **Roles:** Captain (Operator, L12), Weaver (review orchestration), Keel
  (durable state), Watchdog (blindspot taxonomy), AnotherPair (voice audit),
  Quartermaster, Analyst, and crew.
- **Register:** formal / exploration / execution; weave tight or loose;
  tempo full-sail, sustainable-pace, tacking, stop-the-line, SEV-1.
- **Named protocols:** Dead Reckoning (context-death recovery), Fair Wind
  (sequential merge ceremony), Parallax (two-lens triangulation), Darkcat
  Alley (3-model adversarial review), the Gauntlet (verification pipeline).

## HUD spec (as used)

```yaml
watch_officer: <agent>
weave_mode: <tight|loose>
register: <formal|exploration|execution>
tempo: <full-sail|sustainable-pace|tacking|stop-the-line|SEV-1>
true_north: "hired = proof > claim"
bearing: <current heading>
last_known_position: <last completed task>
```

## Retirement criteria (reconstructed)

None were fixed at adoption; the frame was retired by judgment when the
distillation showed the principles were substrate-neutral. Fixing retirement
criteria at adoption is a lesson this archive encodes for successors.

## Canonical artifacts

- `docs/deep-archive/2026-03-27-roadmap-sweep/docs/internal/lexicon.md` (vocabulary, v0.27)
- `docs/deep-archive/2026-03-27-roadmap-sweep/docs/internal/layer-model.md` (L0-L12)
- `docs/internal/narrative-layer.yaml`, `docs/internal/play-by-play.yaml` (narrative record)
- `docs/internal/beyond-captain.yaml`, `docs/internal/sextant.yaml` (Operator calibration)
- `docs/internal/session-decisions-index.yaml` (the chain)
