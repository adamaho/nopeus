import { RuleTester } from "oxlint/plugins-dev";

import { requireServiceKeyPrefixRule } from "#src/effect/rules/require-service-key-prefix.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const options = [{ prefix: "@app/" }];

tester.run("nopeus/require-service-key-prefix", requireServiceKeyPrefixRule, {
  valid: [
    {
      code: 'import { Context } from "effect"; Context.Reference("@app/Flag", { defaultValue: () => false });',
      options,
    },
    { code: 'import * as E from "effect"; E.Context.Service("@app/Service");', options },
    {
      code: 'import { Context } from "effect"; function run(Context) { Context.Service("other"); }',
      options,
    },
    {
      code: 'import { Reference as ref } from "effect/Context"; function run(ref) { ref("other"); }',
      options,
    },

    {
      code: 'import { Context } from "effect"; class Service extends Context.Service<Service, {}>()("@app/Service") {}',
      options,
    },
    {
      code: 'import { Context as Ctx } from "effect"; class Service extends Ctx.Service<Service, {}>()("@app/Service") {}',
      options,
    },
    {
      code: 'import * as Context from "effect/Context"; class Service extends Context.Service<Service, {}>()("@app/Service") {}',
      options,
    },
    {
      code: 'import * as Context from "effect/Context"; const Service = Context.Service<{}, {}>("@app/Service" satisfies string);',
      options,
    },
    {
      code: 'import { Service as makeService } from "effect/Context"; const Tag = makeService<{}, {}>("@app/Service");',
      options,
    },
    'const Context = { Service: () => () => class {} }; class Service extends Context.Service()("other") {}',
  ],
  invalid: [
    {
      code: 'import { Reference as ref } from "effect/Context"; ref("Other", { defaultValue: () => 0 });',
      options,
      errors: [{ messageId: "wrongPrefix" }],
    },
    {
      code: 'import * as E from "effect"; E.Context.Service("@app/");',
      options,
      errors: [{ messageId: "wrongPrefix" }],
    },
    {
      code: 'import { Context } from "effect"; Context.Reference(dynamicKey, { defaultValue: () => 0 });',
      options,
      errors: [{ messageId: "staticKey" }],
    },

    {
      code: 'import { Context } from "effect"; class Service extends Context.Service<Service, {}>()("@other/Service") {}',
      options,
      errors: [{ messageId: "wrongPrefix" }],
    },
    {
      code: 'import { Context } from "effect"; const key = "@app/Service"; class Service extends Context.Service<Service, {}>()(key) {}',
      options,
      errors: [{ messageId: "staticKey" }],
    },
    {
      code: 'import * as Context from "effect/Context"; const Service = Context.Service<{}, {}>("@other/Service");',
      options,
      errors: [{ messageId: "wrongPrefix" }],
    },
    {
      code: 'import { Service as makeService } from "effect/Context"; const key = "@app/Service"; const Tag = makeService<{}, {}>(key);',
      options,
      errors: [{ messageId: "staticKey" }],
    },
  ],
});
