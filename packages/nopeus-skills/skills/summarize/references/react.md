# React design

Use these defaults with the project's router, client, and data library. Explain
exceptions through the behavior they support.

## Responsibilities

| Part | Owns |
| --- | --- |
| Route boundary | Read and validate route/search params, adapt navigation, and pass explicit inputs to the feature. Prefetch through the same data layer when needed. |
| Feature page or container | Coordinate feature behavior and state, consume the data layer, and compose visual components. |
| Data layer | Call the SDK or contract-derived client; own queries, mutations, caching, and invalidation. |
| Visual components | Render props and emit callbacks; own local interaction state where useful. |

Read route params at the route boundary and pass them through props, including
to the feature page. A deep child should not subscribe to the router to discover
its identity. Show how it can be rendered and tested with explicit inputs.

Use an SDK, OpenAPI-generated client, or client derived from the shared API
contract. Keep raw HTTP requests in an explicit transport adapter when one is
needed. Feature and visual components should not introduce raw `fetch` calls.
The cache library is a project choice; React Query is one option, not a requirement.
Avoid duplicating server state in component state or context without a concrete need.

## Props, composition, and reuse

- Show the important props and callbacks from the consumer's perspective. Keep
  dependencies explicit and explain who owns state and derives values.
- Prefer props and component composition before adding context. Use slots or
  children when a layout only needs to place content. New context needs a concrete
  ownership or sharing benefit; identify its provider and consumers.
- Question new hooks that only wrap a call, mirror props, or introduce an effect
  for a value that can be derived directly. Preserve hooks that own useful reusable
  behavior or a meaningful data boundary.
- Inspect the existing design system before adding primitives or wrappers. Reuse
  components that meet the interaction and accessibility needs; point to specific
  candidates. Explain a missing capability before proposing another abstraction.
- Keep feature-specific components and data code together. Shared visual
  components should not depend on a particular feature's router or data layer.

Illustrative interfaces, with each arrow representing explicit inputs or results:

```text
Route reads receiptId
  -> ReceiptPage({ receiptId })
       -> receipt data layer -> API client
       -> ReceiptDetails({ receipt, onDelete })
```

`ReceiptDetails` can be exercised using a receipt and callback without a router
or query provider. The page coordinates loading, failure, and mutation behavior.

Composition can also keep a layout independent of feature state:

```tsx
<ReceiptLayout toolbar={<ReceiptFilters value={filters} onChange={setFilters} />}>
  <ReceiptList receipts={receipts} onSelect={selectReceipt} />
</ReceiptLayout>
```

This is an illustrative composition, not a mandatory component hierarchy. Show
the actual interfaces and relevant folders when reviewing an implementation.
