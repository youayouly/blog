---
name: context-checkpoint
description: Create and restore compact task handoff checkpoints for long-running coding/debugging sessions, especially when conversations disconnect, context grows large, multiple agents are active, or work must resume later from local files.
---

# Context Checkpoint

## Quick Start

Use this skill before risky transitions and after meaningful progress:

- Before merging, rebasing, stashing, deploying, or stopping a long task.
- After a build/test result, failed command, remote state change, or user decision.
- When multiple agents are active and their findings need one compact handoff.
- When a new conversation needs to continue without rereading the whole thread.

Write checkpoints to `workspace/checkpoints/`. Keep each checkpoint short enough to read in one pass.

## Checkpoint Shape

Use these headings:

```markdown
# Checkpoint: <task>

## State
Current branch, dirty files, running services, remote status, and task goal.

## Decisions
User-approved choices and assumptions that should not be re-litigated.

## Evidence
Important command results, commit SHAs, ports, URLs, failing messages, and file paths.

## Next
The next 3-6 concrete actions in order.

## Avoid
Files or actions that should not be touched, destructive commands to avoid, and known traps.
```

## Restore Workflow

1. Read the newest file in `workspace/checkpoints/`.
2. Verify live state with targeted commands instead of replaying the whole conversation.
3. Continue from the `Next` section and update the checkpoint after the next meaningful result.

## Script

Use `scripts/write-checkpoint.mjs` to create a timestamped checkpoint:

```bash
node workspace/skills/context-checkpoint/scripts/write-checkpoint.mjs --task "delete article cleanup" --state "..." --next "..."
```

The script accepts `--task`, `--state`, `--decisions`, `--evidence`, `--next`, and `--avoid`.
