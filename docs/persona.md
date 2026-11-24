# Ethan from Wazoo

The persona for this stream, built only from Wazoo's public material (the org profile,
the platform map, the company handbook, and the design system). Everything marked
_suggestion_ is an idea, not canon.

## The premise in one breath

You are **Ethan, founder of Wazoo**, building **world models as a service for AI
agents** in public. Wazoo is a small team of people and AI agents, and the stream is
where the work happens: real repos, real reviews, real mistakes.

> "World models as a service for AI agents."

## The persona

- **Role:** founder, and the human in the loop. The handbook puts it this way: you
  approve merges, deploys, purchases, and anything sent on your behalf. That is the
  show's spine: agents propose, you decide, out loud.
- **Voice:** developer-first, high-fidelity, slightly quirky (the design system's own
  words). Explain the real mechanism plainly. Say "I don't know yet" and then find out.
- **Operating principle:** Wazoo's tooling runs on Wazoo before it runs on anyone else.
  Dogfooding is the content.
- **Look:** dark, Sunset Orange (`#FF8C00`) on near-black, monospaced type (IBM Plex
  Mono). The overlays already use this palette.

## What's on the bench

Public repositories, grouped the way the platform map groups them. Any of these can be a
session goal.

| Area             | Repos                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Platform         | `wazoo-api` (control plane), `worlds-api` (data plane), `wazoo-console`   |
| SDKs and clients | `worlds-sdk-ts`, `worlds-client-ts`, `wazoo-client-ts`, `worlds-kit`      |
| Engine           | `sparql-engine`, `reasoner` (OWL 2 RL)                                    |
| Storage          | `worlds-cloudflare`, `worlds-sqlite`, `worlds-postgres`, `worlds-libsql`  |
| Agent tooling    | `wazoo-tools`, `wazoo-skills`, `wazoo-cli`, `wiki` (SHACL and SPARQL CLI) |
| Memory           | `memsdk`, `memsdk-worlds`, `memsdk-letta`, `wazoobench`                   |
| Standards        | `linked-markdown` (spec and implementations)                              |
| Workflow         | `workspace`, `workspace-cli` (`wspace`)                                   |
| Explainers       | `wazoo-diagrams`, `docs.wazoo.dev`                                        |

The console is in private beta. The map of everything is
[`wazootech/wazootech`](https://github.com/wazootech/wazootech).

## Vocabulary

Use the platform's own words, and define each once per stream for anyone who just
arrived: **world**, **world model**, **knowledge graph**, **SPARQL**, **control plane**,
**data plane**, **memory** (for agents). There is no catchphrase yet. Let one come from
chat.

## Recurring bits (suggestions)

Each one maps onto something the kit already does.

- **Human in the loop.** When an agent's PR is ready, read it on stream and say what you
  are approving and why. A merge you can explain is good content.
- **With and without memory.** `wazoobench` scores tasks with and without memory. Make a
  prediction (the HUD scoreboard) about whether context helps on the next task, then
  check.
- **`wspace check`.** Open the session with it and close with it, the way the workspace
  guide says agents do. It is a built-in start and end ritual.
- **Diagram of the day.** Pick one `wazoo-diagrams` figure and explain it for two
  minutes. Good for the Starting Soon and Break scenes when you have nothing else to
  say.
- **Break.** Stand up. The Break scene is the ritual; no costume needed.

## On-stream hygiene

- Never show `.env` files, tokens, provider keys, or a secrets manager. Close those
  windows before going live.
- Keep private repositories and private-beta customer details off screen. If you are
  unsure whether a repo is public, check it first.
- A leaked credential gets revoked and rotated, not just cut from the VOD.

## Open questions

- **Channel handle:** the name viewers see. Keep your own name visible.
- **Agent teammates:** whether to name them on stream. The handbook lists them, but it
  is your call.
- **Catchphrase:** wait for one to emerge.

## Sources

- [Wazoo organization profile](https://github.com/wazootech/.github)
- [`wazootech/wazootech`](https://github.com/wazootech/wazootech), the platform map
- [`wazootech/company`](https://github.com/wazootech/company), the handbook
- [`wazootech/wazoo.dev`](https://github.com/wazootech/wazoo.dev), `DESIGN.md`
