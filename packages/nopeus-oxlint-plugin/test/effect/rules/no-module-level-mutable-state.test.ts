import { RuleTester } from "oxlint/plugins-dev";

import { noModuleLevelMutableStateRule } from "#src/effect/rules/no-module-level-mutable-state.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const collection = { messageId: "mutableCollection" };
const binding = { messageId: "mutableBinding" };

tester.run("nopeus/no-module-level-mutable-state", noModuleLevelMutableStateRule, {
  valid: [
    "const make = Effect.sync(() => new Map<string, User>());",
    "export const make = Effect.gen(function* () { const cache = new Map<string, User>(); let count = 0; return create(cache, count); });",
    "function make() { let count = 0; return new Set(); }",
    'const codes: ReadonlyMap<string, number> = new Map([["ok", 200]]);',
    'const codes: ReadonlySet<string> = new Set(["ok"]);',
    'export const codes: ReadonlySet<string> = new Set(["ok"]);',
    "const values = { ok: 200 } as const;",
    "declare let external: ExternalClient;",
    'import { Map } from "./persistent-map"; const values = new Map();',
    'const values = new Map(); import { Map } from "./persistent-map";',
    "class Map {} const values = new Map();",
    "const globalThis = { Map: ImmutableMap }; const values = new globalThis.Map();",
  ],
  invalid: [
    { code: "const cache = new Map<string, User>();", errors: [collection] },
    { code: "export const cache = new Map();", errors: [collection] },
    { code: "const seen = new Set();", errors: [collection] },
    {
      code: "const cache = new WeakMap(); const seen = new WeakSet();",
      errors: [collection, collection],
    },
    { code: "const cache = new globalThis.Map();", errors: [collection] },
    { code: 'const cache = new globalThis["Map"]();', errors: [collection] },
    { code: "const cache = new Map() satisfies ReadonlyMap<string, User>;", errors: [collection] },
    { code: "let count = 0;", errors: [binding] },
    { code: "export let current: User | undefined;", errors: [binding] },
    { code: "var cache = new Map();", errors: [binding] },
  ],
});
