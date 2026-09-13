import { RuleTester } from "oxlint/plugins-dev";

import { requireFetchAbortSignalRule } from "#src/effect/rules/require-fetch-abort-signal.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const prelude = 'import { Effect } from "effect";';
const error = { messageId: "missingSignal" };

tester.run("nopeus/require-fetch-abort-signal", requireFetchAbortSignalRule, {
  valid: [
    `${prelude} Effect.tryPromise({ try: signal => fetch(url, { signal }), catch: toError });`,
    `${prelude} Effect.tryPromise({ try: cancel => fetch(url, { signal: cancel }), catch: toError });`,
    `${prelude} Effect.tryPromise(signal => fetch(url, { ...options, signal }));`,
    `${prelude} Effect.tryPromise({ async try(signal) { return await fetch(url, { signal }); }, catch: toError });`,
    `${prelude} Effect.tryPromise(signal => globalThis.fetch(url, { signal }));`,
    `${prelude} Effect.tryPromise(signal => globalThis["fetch"](url, { signal }));`,
    `${prelude} Effect.tryPromise(signal => fetch(url, { ["signal"]: signal, method: "GET" }));`,
    'import { tryPromise as attempt } from "effect/Effect"; attempt(signal => fetch(url, { signal }));',
    'import * as Fx from "effect/Effect"; Fx.tryPromise(signal => fetch(url, { signal }));',
    `${prelude} function adapter(fetch: ClientFetch) { return Effect.tryPromise(() => fetch(url)); }`,
    `${prelude} function adapter(globalThis: Client) { return Effect.tryPromise(() => globalThis.fetch(url)); }`,
    `${prelude} function adapter(Effect: Client) { return Effect.tryPromise(() => fetch(url)); }`,
    `${prelude} Effect.tryPromise(() => sdk.loadUser(id));`,
    `${prelude} Effect.tryPromise(() => { const later = () => fetch(url); return Promise.resolve(later); });`,
    "fetch(url);",
  ],
  invalid: [
    {
      code: `${prelude} Effect.tryPromise({ try: () => fetch(url), catch: toError });`,
      errors: [error],
    },
    { code: `${prelude} Effect.tryPromise(signal => fetch(url));`, errors: [error] },
    {
      code: `${prelude} Effect.tryPromise(signal => fetch(url, { signal: other }));`,
      errors: [error],
    },
    {
      code: `${prelude} Effect.tryPromise(signal => fetch(url, { signal, ...options }));`,
      errors: [error],
    },
    {
      code: `${prelude} Effect.tryPromise(signal => fetch(url, { signal, [key]: value }));`,
      errors: [error],
    },
    {
      code: `${prelude} Effect.tryPromise(signal => { { const signal = other; return fetch(url, { signal }); } });`,
      errors: [error],
    },
    {
      code: `${prelude} Effect.tryPromise(async signal => { return await fetch(url, options); });`,
      errors: [error],
    },
    {
      code: 'import { tryPromise as attempt } from "effect/Effect"; attempt(() => fetch(url));',
      errors: [error],
    },
    {
      code: 'Effect.tryPromise(() => fetch(url)); import { Effect } from "effect";',
      errors: [error],
    },
    { code: `${prelude} Effect.tryPromise(() => globalThis.fetch(url));`, errors: [error] },
  ],
});
