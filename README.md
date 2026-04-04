# soft-possession

Prototype for a browser-based performance system where an LLM shifts from creative assistant to active co-performer.

## Concept

- **p5.js** for visuals
- **Strudel** for rhythm and pattern
- **Gemma** for structured scene mutation and intervention

The core interface is an **intervention slider**:

0. Observe
1. Suggest
2. Assist
3. Guide
4. Perform
5. Possess

Lower levels behave like creative assistance. Higher levels behave like live intervention within a constrained state space.

## Current state

This repo currently contains:

- Vite app scaffold
- visual concept shell for the control surface
- placeholder state model for intervention-driven performance
- initial activity log / scene mutation prototype

## Planned next steps

1. Add p5.js stage renderer
2. Add Strudel bridge and transport controls
3. Add Gemma adapter returning structured scene JSON
4. Add safety layer for bounded mutations
5. Add autonomous update loop with freeze / resume

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
