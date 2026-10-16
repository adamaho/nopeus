import { RuleTester } from "oxlint/plugins-dev";

import { noTryCatchRule } from "#src/effect/rules/no-try-catch.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-try-catch", noTryCatchRule, {
  valid: [
    'import { Result } from "effect"; Result.try({ try: () => parse(text), catch: error => new MalformedCsv({ cause: error }) });',
    'import { Effect } from "effect"; Effect.try({ try: () => parse(text), catch: error => new MalformedCsv({ cause: error }) });',
    'import { Effect } from "effect"; Effect.tryPromise({ try: () => load(), catch: error => new LoadFailed({ cause: error }) });',
    'import { Effect } from "effect"; operation.pipe(Effect.catch(recover));',
    'import { Effect } from "effect"; operation.pipe(Effect.catchTag("LoadFailed", recover));',
    "try { useResource(); } finally { releaseResource(); }",
    'const example = "try { parse(text); } catch (error) {}";',
  ],
  invalid: [
    {
      code: 'import { Result } from "effect"; function parseRecords(text: string) { try { return Result.succeed(parse(text)); } catch (error) { if (error instanceof CsvError) { return Result.fail(new MalformedCsv({ message: error.message })); } throw error; } }',
      errors: [{ messageId: "useTypedErrorHandling" }],
    },
    {
      code: "try { parse(text); } catch { recover(); }",
      errors: [{ messageId: "useTypedErrorHandling" }],
    },
    {
      code: "async function load() { try { return await request(); } catch (error) { return fallback; } }",
      errors: [{ messageId: "useTypedErrorHandling" }],
    },
    {
      code: 'import { Effect } from "effect"; Effect.gen(function* () { try { yield* operation; } catch (error) { yield* recover(error); } });',
      errors: [{ messageId: "useTypedErrorHandling" }],
    },
    {
      code: "try { parse(text); } catch (error) { throw error; } finally { cleanup(); }",
      errors: [{ messageId: "useTypedErrorHandling" }],
    },
    {
      code: "try { try { parse(text); } catch { recover(); } } catch { fallback(); }",
      errors: [{ messageId: "useTypedErrorHandling" }, { messageId: "useTypedErrorHandling" }],
    },
  ],
});
