import { RuleTester } from "oxlint/plugins-dev";

import { preferEffectPlatformServicesRule } from "#src/effect/rules/prefer-effect-platform-services.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/prefer-effect-platform-services", preferEffectPlatformServicesRule, {
  valid: [
    'import { FileSystem, Path } from "effect";',
    'import { readFile } from "./fs.ts";',
    'import type { Stats } from "node:fs";',
    'import { type ParsedPath } from "node:path";',
  ],
  invalid: [
    {
      code: 'import { readFile } from "node:fs/promises";',
      errors: [{ messageId: "platformService" }],
    },
    {
      code: 'import path from "node:path";',
      errors: [{ messageId: "platformService" }],
    },
    {
      code: 'import { type Stats, readFile } from "node:fs";',
      errors: [{ messageId: "platformService" }],
    },
  ],
});
