import { RuleTester } from "oxlint/plugins-dev";

import { requireServiceMethodSpacingRule } from "#src/rules/require-service-method-spacing.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const error = { messageId: "separate" };

tester.run("nopeus/require-service-method-spacing", requireServiceMethodSpacingRule, {
  valid: [
    `function make() {
      const dependency = yieldValue();

      const get = Effect.fn("get")(
        function* () { return yield* dependency.get(); },
      );

      const list = Effect.fn("list")(
        function* () { return yield* dependency.list(); },
      );

      return Service.of({ get, list });
    }`,
    `function make() {
      const get = () => 1;
      const list = () => 2;
      return Service.of({ get, list });
    }`,
    `function unrelated() {
      const get = Effect.fn("get")(
        function* () { return 1; },
      );
      const list = Effect.fn("list")(
        function* () { return 2; },
      );
      return { get, list };
    }`,
  ],
  invalid: [
    {
      code: `function make() {
        const get = Effect.fn("get")(
          function* () { return 1; },
        );
        const list = Effect.fn("list")(
          function* () { return 2; },
        );
        return Service.of({ get, list });
      }`,
      errors: [error, error],
    },
    {
      code: `function make() {
        const get = Effect.fn("get")(
          function* () { return 1; },
        );
        // Expose the method.
        return Service.of({ get });
      }`,
      errors: [error],
    },
  ],
});
