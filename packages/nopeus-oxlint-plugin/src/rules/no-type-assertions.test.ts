import { RuleTester } from "oxlint/plugins-dev";

import { noTypeAssertionsRule } from "./no-type-assertions.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const error = { messageId: "typeAssertion" };

tester.run("nopeus/no-type-assertions", noTypeAssertionsRule, {
  valid: [
    "const method = 'GET' as const;",
    "const user = input satisfies User;",
    "const decodeUser = Schema.decodeUnknownEffect(User); const user = decodeUser(input);",
    "const rows = yield* sql<User>`select * from users`; const first = rows[0];",
    "const users = yield* database.select().from(userTable);",
  ],
  invalid: [
    { code: "const user = input as User;", errors: [error] },
    { code: "const user = <User>input;", errors: [error] },
    { code: "const user = input as unknown as User;", errors: [error] },
    {
      code: "// SAFETY: the caller validated this value.\nconst user = input as User;",
      errors: [error],
    },
  ],
});
