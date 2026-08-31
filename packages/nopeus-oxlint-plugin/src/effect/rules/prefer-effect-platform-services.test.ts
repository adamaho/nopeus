import { RuleTester } from "oxlint/plugins-dev";

import { preferEffectPlatformServicesRule } from "./prefer-effect-platform-services.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/prefer-effect-platform-services", preferEffectPlatformServicesRule, {
  valid: ['import { FileSystem, Path } from "effect";', 'import { readFile } from "./fs.ts";'],
  invalid: [
    {
      code: 'import { readFile } from "node:fs/promises";',
      errors: [{ messageId: "platformService" }],
    },
    {
      code: 'import path from "node:path";',
      errors: [{ messageId: "platformService" }],
    },
  ],
});
