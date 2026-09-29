import { RuleTester } from "oxlint/plugins-dev";

import { requireSchemaGroupSpacingRule } from "#src/rules/require-schema-group-spacing.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const error = { messageId: "separate" };

tester.run("nopeus/require-schema-group-spacing", requireSchemaGroupSpacingRule, {
  valid: [
    `import { Schema } from "effect";

    const Row = Schema.Struct({ id: Schema.String });
    const decodeRow = Schema.decodeUnknownEffect(Row);

    const OtherRow = Schema.Struct({ id: Schema.Number });
    const decodeOtherRow = Schema.decodeUnknownEffect(OtherRow);`,
    `const Row = Schema.Struct({ id: Schema.String });
    type Row = typeof Row.Type;
    const decodeRow = Schema.decodeUnknownEffect(Row);`,
    `const decodeRow = Schema.decodeUnknownEffect(Row);
    const encodeRow = Schema.encodeUnknownEffect(Row);`,
    `function make() {
      const first = Schema.Struct({ id: Schema.String });
      const second = Schema.Struct({ id: Schema.Number });
      return { first, second };
    }`,
  ],
  invalid: [
    {
      code: `const Row = Schema.Struct({ id: Schema.String });
      const decodeRow = Schema.decodeUnknownEffect(Row);
      const OtherRow = Schema.Struct({ id: Schema.Number });`,
      errors: [error],
    },
    {
      code: `const first = Schema.String.check(Schema.isNonEmpty());
      export const second = Schema.Struct({ value: first }).annotate({ identifier: "second" });`,
      errors: [error],
    },
    {
      code: `const Row = Schema.Struct({ id: Schema.String });
      type Row = typeof Row.Type;
      const OtherRow = Schema.Struct({ id: Schema.Number });`,
      errors: [error],
    },
    {
      code: `const helper = 1;
      // A new schema starts here.
      const Row = Schema.Struct({ id: Schema.String });`,
      errors: [error],
    },
  ],
});
