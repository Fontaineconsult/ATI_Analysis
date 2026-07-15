# ADR-001 — Web framework & API contract

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Daniel Fontaine

## Context
The AWS scale/reliability refactor raised the question of whether to keep **Flask** or move to
**Django** "for maintenance," and separately a desire for a typed frontend contract (**Orval**)
and an eventual move to **FastAPI**.

The system of record is a **Neo4j graph accessed via neomodel**, not a relational database. The
business logic already lives in a framework-agnostic `queries/<domain>` layer that the Flask
endpoints *and* the `ati-graph` MCP server both call.

## Decision
1. **Stay on Flask** for this migration.
2. **Rule out Django.** Its marquee maintenance features (ORM, migrations, auto-admin, built-in
   auth) are all coupled to its **relational ORM**. With a graph datastore they are inert:
   Django Admin can't introspect Neo4j nodes, migrations don't apply, and `django-neomodel` is a
   thin shim that keeps you writing neomodel/Cypher anyway. You'd pay a full HTTP-layer rewrite
   (28 MethodView modules, auth, config, tests) to inherit machinery you can't use.
3. **Add a Pydantic v2 + OpenAPI 3.1 contract layer to Flask now** (via a Pydantic-native bridge —
   shortlist **flask-openapi3** / **spectree**, chosen by spike). The OpenAPI spec becomes the
   single source of truth for the API.
4. **Frontend consumes the spec via Orval** (typed client + TanStack Query hooks + MSW mocks).
5. **FastAPI is a future, optional migration**, not on the critical path. Because the contract is
   framework-agnostic Pydantic + the `queries/` layer, that move becomes a drop-in rather than a
   rewrite.

## Why not FastAPI *now*?
FastAPI is the better long-term fit than Django (typed contracts, Pydantic validation, auto
OpenAPI, async), but adopting it *now* is still an HTTP-layer rewrite that would block the
AWS/scale work. Introducing the Pydantic+OpenAPI contract on Flask captures ~80% of FastAPI's
maintainability benefit today and de-risks the eventual switch. The user's directive: "FastAPI on
the back… but stick with Flask for now."

## Consequences
- **New deps now:** Pydantic v2 + an OpenAPI bridge on the backend; Orval + TanStack Query + Vite
  + TypeScript on the frontend.
- **Incremental adoption:** endpoints get schemas domain by domain; the frontend migrates area by
  area (strangler-fig). No big-bang.
- **Payoff:** compile-time-checked API contract, drift caught in CI, deterministic frontend tests
  (MSW mocks), an agent-consumable spec, and a low-risk path to FastAPI later.
- **Revisit trigger:** if the Flask endpoint layer becomes a maintenance pain, or async/perf needs
  push past what Flask+waitress handles, open ADR-00x to schedule the FastAPI migration.
