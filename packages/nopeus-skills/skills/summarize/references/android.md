# Android design

Use these defaults with the project's existing Compose or Views UI, navigation,
dependency injection, and data libraries. Explain exceptions through the behavior
they support. Do not require a migration to Compose or a new architecture to
plan or summarize a change.

## Responsibilities

| Part | Owns |
| --- | --- |
| Activity, Fragment, or navigation destination | Adapt platform and navigation inputs, obtain screen dependencies, and connect lifecycle-aware state observation to the UI. |
| ViewModel or existing screen state holder | Coordinate screen behavior, expose UI state, and handle user actions through data/domain interfaces. |
| Screen content and reusable UI | Render explicit state and emit callbacks; own local interaction state where useful. |
| Repository or data source | Own data access, caching, synchronization, and storage or transport details behind deliberate interfaces. |
| Application or dependency injection setup | Assemble dependencies and define their scopes and lifetimes. |

Show the actual boundaries; these are responsibilities, not mandatory classes.
Do not add a use-case layer, repository wrapper, or Gradle module without a concrete
coordination, reuse, or dependency-isolation benefit. Keep feature code local and
explain new package/module boundaries and dependency direction.

## State, lifecycle, and navigation

- Show who owns UI state, how user actions change it, and how loading, empty,
  failure, and retry behavior reach the screen. Avoid duplicating repository data
  in multiple mutable state holders without a concrete need.
- Read navigation arguments at the destination boundary and pass explicit inputs
  onward. Keep reusable content independent of the navigation controller, dependency
  injection container, and ViewModel when practical. Show callbacks for navigation
  requests and identify who executes them.
- Explain lifecycle-aware Flow collection, coroutine ownership/cancellation, and
  side-effect triggers when changed. For Compose, inspect effect keys and avoid
  launching work as an incidental result of recomposition. For Views, account for
  the Fragment view lifecycle rather than only the Fragment lifetime.
- Distinguish transient UI state, configuration-change survival, and process-death
  restoration. Explain relevant uses of `rememberSaveable`, `SavedStateHandle`, or
  persistent storage; do not imply a ViewModel alone survives process death.
- Explain delivery and consumption of navigation, messages, and other one-time
  effects when relevant, including possible repeats or losses. Follow the project's
  mechanism rather than prescribing an event wrapper for every action.

## Platform behavior and reuse

- Reuse the project's design system, themes, resources, and accessibility patterns.
  Explain meaningful changes to semantics, content descriptions, touch targets,
  localization, and screen sizes where the change affects them.
- Keep network and database implementation out of visual UI. Show the public data
  contract, source of truth, and offline/error behavior when changed. Identify
  dispatchers and blocking work when they affect responsiveness.
- For permissions, intents, deep links, services, or background work, explain the
  platform entry point, lifetime, failure paths, and relevant Android version
  constraints. Mention manifest, SDK, Gradle, or dependency changes and their
  compatibility effects when present, not as a checklist for unrelated work.

## Show changed Android contracts

Show actual changed UI-state types, screen inputs/callbacks, ViewModel actions,
navigation arguments, or repository signatures that matter to the change. Include
resource or manifest contracts when they define externally visible behavior.
Use concise excerpts; do not paste an entire screen.

Illustrative flow, not a mandatory component hierarchy:

```text
Receipt destination reads receiptId
  -> ReceiptViewModel(receiptId, repository)
       -> repository observes receipt data
       -> ReceiptUiState
  -> ReceiptScreen(state, onRetry, onDelete, onBack)
```

`ReceiptScreen` can be previewed or tested with state and callbacks without a live
database or navigation controller. Explain where state is collected and how
actions reach the state holder. Show the actual affected packages, resources,
tests, and Gradle modules in the change snapshot.

## Evidence and limits

Distinguish compilation, local unit tests, instrumented/UI tests, and manual
device or emulator checks. State the variant and device/API level when known and
relevant. Do not treat a successful build or Compose preview as proof of runtime,
navigation, lifecycle, or accessibility behavior. Call out unverified behavior
such as rotation, process recreation, permission denial, or offline handling only
where the change makes it material.
