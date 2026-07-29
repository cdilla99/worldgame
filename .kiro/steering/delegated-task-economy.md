---
inclusion: always
---

# Delegated Task Economy

Before delegating, classify the task and use the lowest-cost model tier that is adequate **when the invocation UI/tool exposes a model or preset selector**:

- **Routine:** deterministic edits, formatting, documentation, metadata, simple searches. Prefer the least capable adequate tier.
- **Standard:** bounded code changes with clear requirements. Prefer the normal coding tier.
- **High-risk/complex:** architecture, ambiguous debugging, security/auth, destructive or production/data changes, or broad cross-boundary work. A stronger tier is justified.

Repository steering cannot enforce or select a model. If no selector is available, keep the available model and reduce cost by delegating one bounded task with only its objective, relevant files, constraints, acceptance criteria, and required validation. Do not send broad repository context; escalate only when uncertainty or risk requires it.

Validation must be proportional:
- Documentation, metadata, or instruction-only changes: validate syntax/format/diagnostics only; do not run application tests without a behavioral reason.
- Behavior/code changes: run the smallest targeted check covering the changed behavior; broaden to affected packages or the full suite only for cross-cutting or high-regression-risk changes.
- Never skip property tests or validation explicitly required by a spec task or user request.
