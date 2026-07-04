# Distillation: Naval Frame

Performed 2026-03-10 (lexicon v0.26, commits 540dc57, 607607f, 668c23b) via
independent cross-triangulation: Architect (naval -> Linux) and Analyst
(naval -> SWE).

## Findings

- **~60% mapped to established frameworks** and took the established names:
  readback (aviation CRM), verification pipeline (Reason's Swiss Cheese
  model), stop-the-line (Andon cord), standing policy (ADRs), cognitive
  deskilling (Bainbridge 1983), quality gate (poka-yoke), working set
  (Denning).
- **~18% was genuinely novel**, clustered on context engineering for LLM
  agents, a domain that did not exist before agentic workflows: dumb zone,
  compaction loss, weave, cold/hot context pressure, sycophantic
  amplification loop, spinning to infinity.
- **6 terms retired** with the frame; 9 novel terms kept.

## Machinery promoted to permanent (Layer 1)

- Append-only decision chain [SD-266]
- Readback before acting [SD-315]
- Pitcommit tree-hash attestation and the gauntlet gate
- Darkcat multi-model adversarial review, ROI-bounded [SD-318]
- Slopodar taxonomy (later itself distilled into the product failure taxonomy,
  SD-329)

## The one-line verdict

The contribution was not a new governance framework; it was a vocabulary for
a new operational domain built on top of established frameworks. The frame
survived translation into plain vocabulary with its enforcement machinery
intact, which is the falsifiable evidence it was governance and not costume.
