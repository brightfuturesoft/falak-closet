<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## OpenSpec Workflow (Required for Non-Trivial Work)

This repository uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven development. Planning and specification artifacts live in the `openspec/` directory.

### Core Workflows
- **Proposing a Change**: Start by running the `openspec-propose` skill (or `/opsx-propose` command) to outline the proposal, design, specs, and task checklist inside `openspec/changes/<change-name>/`.
- **Applying a Change**: Use the `openspec-apply-change` skill (or `/opsx-apply` command) to execute tasks listed in `tasks.md`. Update the checklist progress as you work.
- **Archiving a Change**: Run the `openspec-archive-change` skill (or `/opsx-archive` command) once implementation is complete to move specs to main capability folders and clean up.
- **Trivial Work**: Small typos, documentation, or trivial refactorings with no behavior changes may skip the OpenSpec workflow.

Always consult the roadmap in `openspec/config.yaml` to ensure alignement with existing specifications and priorities.
