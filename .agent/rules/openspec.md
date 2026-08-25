# OpenSpec Workflow Rule

You MUST use OpenSpec for all non-trivial changes in this repository.

## Instructions
1. Before implementing any feature or behavior change, run `openspec-propose` (or `/opsx-propose` command) to create the change proposal, specifications, design document, and tasks checklist.
2. Only write source code or run modifying commands after the change has been proposed and approved.
3. During implementation, use `openspec-apply-change` (or `/opsx-apply` command) and keep the task checklist updated in `openspec/changes/<change-name>/tasks.md`.
4. Run `openspec validate --all` to verify that your changes are compliant with specifications.
5. Run `openspec-archive-change` (or `/opsx-archive` command) when implementation and verification are complete.
