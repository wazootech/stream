# Ethan from Wazoo

The YouTube channel is [Wazoo Ethan (@WazooEthan)](https://www.youtube.com/@WazooEthan).

## The stream

In my own words:

> we are just chilling/chatting about open source programming and solving problems and
> tackling issues/PRs and reviewing code related to the wazootech org on github showing
> off modern software engineering best practices and growing our community

> oh and sometimes i play video games on the screen while waiting between automations to
> run

I'm the founder of Wazoo, which builds world models as a service for AI agents. Keep it
plain and casual.

## Decisions

Made on 2026-11-25:

- **Agent teammates:** say "my agents" on stream, and keep agent teammate names off
  screen.
- **Catchphrase:** not yet. We won't force one, and can revisit if one comes from chat.

## What's on the bench

Public repositories, grouped the way the platform map groups them.

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

## Look and setup

The look is dark, with Sunset Orange (`#FF8C00`) on near-black and monospaced type (IBM
Plex Mono). The overlays use this accent color.

The hardware list is the `!setup` reply in [`chat-commands.md`](chat-commands.md).

## On-stream hygiene

- Never show `.env` files, tokens, provider keys, or a secrets manager. Close those
  windows before going live.
- Keep private repositories and private-beta customer details off screen. If you are
  unsure whether a repo is public, check it first.
- A leaked credential gets revoked and rotated, not just cut from the VOD.

## Sources

- [Wazoo organization profile](https://github.com/wazootech/.github)
- [`wazootech/wazootech`](https://github.com/wazootech/wazootech), the platform map
- [`wazootech/company`](https://github.com/wazootech/company), the handbook
- [`wazootech/wazoo.dev`](https://github.com/wazootech/wazoo.dev), `DESIGN.md`
