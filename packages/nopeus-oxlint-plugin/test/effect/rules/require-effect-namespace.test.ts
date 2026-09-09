import { RuleTester } from "oxlint/plugins-dev";

import { requireEffectNamespaceRule } from "../../../src/effect/rules/require-effect-namespace.ts";
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const options = [{ prefix: "@app/" }];
// Independent catalogue exercises each API through every supported import form.
const apis = [
  ["Context", "Service", "(KEY)"],
  ["Context", "Service", "()(KEY)"],
  ["Context", "Reference", "(KEY, { defaultValue: () => 0 })"],
  ["Effect", "fn", "(KEY)(function* () {})"],
  ...["makeSpan", "makeSpanScoped", "useSpan"].map((name) => ["Effect", name, "(KEY, () => task)"]),
  ["Layer", "span", "(KEY)"],
  ...["Effect", "Layer", "Stream", "Channel", "RequestResolver"].flatMap((module) => [
    [module, "withSpan", "(KEY)"],
    [module, "withSpan", "(task, KEY)"],
  ]),
  ...["withSpanScoped", "withLogSpan"].flatMap((name) => [
    ["Effect", name, "(KEY)"],
    ["Effect", name, "(task, KEY)"],
  ]),
  ...["Class", "Error"].map((name) => ["Schema", name, "(KEY)({})"]),
  ...["TaggedClass", "TaggedError"].flatMap((name) => [
    ["Schema", name, "()(KEY, {})"],
    ["Schema", name, '(KEY)("@app/Tag", {})'],
    ["Data", name, "(KEY)"],
  ]),
  ["Schema", "TaggedStruct", "(KEY, {})"],
  ["Request", "TaggedClass", "(KEY)"],
  ["Request", "tagged", "(KEY)"],
  ...["counter", "gauge", "frequency", "histogram", "summary", "summaryWithTimestamp", "timer"].map(
    (name) => ["Metric", name, "(KEY, {})"],
  ),
];
const calls = apis.flatMap(([module, name, args]) => [
  `import { ${module} } from "effect"; ${module}.${name}${args};`,
  `import { ${module} as M } from "effect"; M.${name}${args};`,
  `import * as M from "effect/${module}"; M.${name}${args};`,
  `import { ${name} as f } from "effect/${module}"; f${args};`,
  `import * as E from "effect"; E.${module}.${name}${args};`,
]);
tester.run("nopeus/require-effect-namespace", requireEffectNamespaceRule, {
  valid: [
    ...calls.map((code) => ({ code: code.replace("KEY", '"@app/Name"'), options })),
    ...["`@app/Name`", '("@app/Name" satisfies string)', '("@app/Name" as const)'].map((key) => ({
      code: `import { Context } from "effect"; Context.Service(${key});`,
      options,
    })),
    ...[
      'import { Effect } from "effect"; function run(Effect) { Effect.fn("foreign"); }',
      'import { fn } from "effect/Effect"; function run(fn) { fn("foreign"); }',
      'import * as E from "effect"; function run(E) { E.Effect.fn("foreign"); }',
      'import { Effect } from "other"; Effect.fn("foreign");',
      'const Context = { Service() {} }; Context.Service("foreign");',
      'import { Effect, Schema, Metric } from "effect"; Effect.log("message"); Effect.fnUntraced(function* () {}); Schema.Literal("pending"); Metric.withAttributes({ region: "west" });',
    ].map((code) => ({ code, options })),
    'import { Context } from "effect"; Context.Service("@default/Service");',
  ],
  invalid: [
    ...calls.map((code) => ({
      code: code.replace("KEY", '"@other/Name"'),
      options,
      errors: [{ messageId: "wrongPrefix" }],
    })),
    ...calls.map((code) => ({
      code: code.replace("KEY", "dynamicName"),
      options,
      errors: [{ messageId: "staticKey" }],
    })),
    ...['"@app/"', '""', '"@application/Name"'].map((key) => ({
      code: `import { Effect } from "effect"; Effect.fn(${key})(() => task);`,
      options,
      errors: [{ messageId: "wrongPrefix" }],
    })),
    {
      code: 'import { Schema } from "effect"; Schema.TaggedError("wrong")("wrong", {});',
      options,
      errors: [{ messageId: "wrongPrefix" }, { messageId: "wrongPrefix" }],
    },
    {
      code: 'import { Context } from "effect"; Context.Service(`@app/${name}`);',
      options,
      errors: [{ messageId: "staticKey" }],
    },
    {
      code: 'import { Context } from "effect"; Context.Service();',
      options,
      errors: [{ messageId: "staticKey" }],
    },
  ],
});
