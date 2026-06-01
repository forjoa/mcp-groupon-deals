# CLAUDE.md — MCP Groupon Deals

## Mandatory Agent Pipeline

**Every task or feature request MUST flow through all five agents in strict order. No step may be skipped.**

```
analyzer → architect → coder → tester/reviewer → documenter
```

Invoke each agent explicitly and wait for its output before proceeding to the next. The output of each agent is the input for the next.

### Pipeline execution rules

1. **analyzer** — Always the first agent to run. It receives the raw user request and returns a structured task definition. Never start implementation without this step.
2. **architect** — Receives the structured task. Designs the implementation plan, data flow, and file-level changes before any code is written.
3. **coder** — Receives the architecture plan. Writes all code. Never writes code without a prior architect plan.
4. **tester/reviewer** — Receives the written code. Reviews every file changed. If it raises blockers, return to **coder**. Only passes when the code meets quality bar.
5. **documenter** — Always the last agent to run. Updates `README.md` and `CHANGELOG.md` unconditionally. If either file does not exist, creates it.

---

## Project context

- **Stack**: TypeScript, Node.js, MCP SDK (`@modelcontextprotocol/sdk`)
- **Transport**: stdio
- **External API**: `groupon.es/mobilenextapi/graphql` (reverse-engineered, no official docs)
- **Architecture reference**: [ARCH.md](./ARCH.md)

## Code conventions

- All code in **English** (comments, variable names, types, error messages)
- All documentation in **English**
- Strict TypeScript — no `any`, no implicit types
- Functional style preferred — pure functions, no side effects in tool handlers
- No inline comments unless the WHY is non-obvious
- Files follow the structure defined in ARCH.md §4

## Quality bar (enforced by tester/reviewer)

- Zero TypeScript errors (`tsc --noEmit` must pass)
- No `console.log` left in production paths (use structured logging or remove)
- All tool handlers validate their inputs before calling the Groupon client
- Cache TTL logic must be tested
- No hardcoded strings outside of `src/groupon/divisions.ts` and `src/groupon/client.ts`
