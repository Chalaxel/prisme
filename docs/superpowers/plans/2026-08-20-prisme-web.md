# PRISME Web Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Playable local hot-seat web prototype of PRISME with a live rules-tuning panel.

**Architecture:** Pure TypeScript engine (deck, combos, specials, scoring, turn machine) consumed by a React + Vite UI. `RulesConfig` is the single source of tunable parameters; applying it starts a new game.

**Tech Stack:** React 19, Vite, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-08-20-prisme-web-design.md`

## Global Constraints

- French UI copy
- Hot-seat only; no network, no AI
- Apply balance changes = new game
- Specials played from hand do not enter numeric combos
- Common specials count as their assigned color

## Files

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- `src/rules/defaultRules.ts` — RulesConfig
- `src/engine/types.ts`, `deck.ts`, `combinations.ts`, `specials.ts`, `score.ts`, `game.ts`
- `src/engine/*.test.ts`
- `src/ui/` — App, screens, CardView, BalancePanel
- `src/styles/index.css`

## Tasks

### Task 1: Scaffold + RulesConfig + engine tests for combos
### Task 2: Turn machine (phases, specials order, capture, draw, end)
### Task 3: React hot-seat UI + balance panel
### Task 4: Wire `npm run dev` / `npm test` and verify a full game loop
