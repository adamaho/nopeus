# Backend and public APIs

Review both the HTTP API consumers see and the public interfaces used between
domains in the same application. Show responsibility and dependency boundaries
even when they are not separate packages.

## Responsibilities

| Part | Owns |
| --- | --- |
| API contract | Public request/response schemas, declared errors, and HTTP behavior. |
| HTTP adapter | Decode transport inputs, apply HTTP concerns, and delegate to the domain. |
| Domain service or workflow | Business behavior and coordination of required repositories and other capabilities. |
| Repository | A typed persistence interface with queries, storage details, and persistence failures behind it. |
| Composition root | Assemble services, repositories, infrastructure, and runtime lifecycles. |

Repositories are valid public interfaces across domains. A service or workflow
may coordinate several domains' repositories. Do not add pass-through services
just to forbid that sharing. Keep SQL and storage implementation private; explain
transaction ownership and consistency when a workflow spans repositories.

Inspect consumer-facing inputs, outputs, errors, authorization responsibilities,
and compatibility. Include retries or idempotency where they affect the contract.
Avoid leaking database rows, transport machinery, or infrastructure configuration
into interfaces that do not need them.

Use domain-named errors for meaningful business failures. For Effect HTTP APIs,
declare response statuses with the built-in schema annotations, such as
`ReceiptNotFound.pipe(HttpApiSchema.status(404))` in an endpoint's error schemas.
Check the installed Effect version's API. Do not require manual catch-and-map
handlers for a status already expressed by the schema. Genuine error recovery or
translation remains a separate behavior to explain.

Show how Effect services and Layers compose when relevant. Keep runtime assembly
at application entry points and expose service contracts that tests can provide.

## Goho-style example

This layout illustrates the agreed separation; it is not a required scaffold or
a claim that every existing Goho implementation follows every recommendation:

```text
packages/goho-api/src/
  api.ts                  HTTP endpoints and declared statuses
  receipts.ts             public receipt schemas
  receipt-uploads.ts      public upload schemas
clients/goho-server/src/
  client.ts               client derived from the shared Effect API contract
programs/goho-server/src/
  main.ts                 dependency and runtime composition
  http.ts                 HTTP handlers
  receipts/
    service.ts            receipt operations
    repository.ts         public persistence interface and private implementation
  receipt-uploads/
    service.ts            upload operations
    repository.ts         upload persistence
    worker.ts             processing workflow
  database/               SQL and transaction infrastructure
```

The upload workflow can use both the receipt and upload repositories to create
a receipt and record upload completion in one transaction. Review that shared
contract and transaction behavior rather than treating the cross-domain import
as a violation by itself.

The Goho client is derived from its Effect API contract; it is not generated from
OpenAPI. An SDK or OpenAPI-generated client is also appropriate elsewhere. Keep
one authoritative API contract and expose deliberate package exports or public
domain modules; do not require a barrel file for every folder.
