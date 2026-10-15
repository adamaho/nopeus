# Choose models and roles

Choose a model for each role before starting. Reuse the user's existing choices
and ask for all missing choices together. Offer available models; do not silently
select defaults.

| Role | Responsibility |
| --- | --- |
| Orchestrator | Coordinate the requested work, integration, progress, and human handoff. |
| Workers | Implement assigned PR groups and provide validation evidence. |
| Reviewers | Independently review smaller PRs and the combined feature. |

Roles may use different models or providers when the tools support them. For
example: Claude orchestrates and reviews; Astra implements. Resolve these names
against available models rather than treating them as fixed identifiers.

- Verify the requested models and execution tools before dispatching work.
- **Ambiguous or unavailable model:** explain the gap and ask for an available
  choice or supported handoff. Never silently substitute a model or claim a
  switch that did not occur.
- If the requested orchestrator differs from the current session, arrange an
  authorized, supported handoff or ask the user to start the appropriate session.
- **Independent review:** use a separate agent session or review service that did
  not implement the changes. It may use the same model as another role.
- Record the selected models and their assignments with execution progress so
  resumed work retains the choices. Honor later user overrides explicitly.

