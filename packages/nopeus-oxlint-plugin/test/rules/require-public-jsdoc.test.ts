import { RuleTester } from "oxlint/plugins-dev";

import { requirePublicJSDocRule } from "#src/rules/require-public-jsdoc.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const invalid = { messageId: "invalidJSDoc" };
const missing = { messageId: "missingJSDoc" };

tester.run("nopeus/require-public-jsdoc", requirePublicJSDocRule, {
  valid: [
    `
      /**
       * A stable user identifier.
       *
       * @category models
       * @since 1.0.0
       */
      export type UserId = string;
    `,
    `
      /**
       * Decodes a user from untrusted input.
       *
       * **When to use**
       *
       * Use when accepting a user at an I/O boundary.
       *
       * **Details**
       *
       * The returned value has already satisfied the User schema.
       *
       * **Gotchas**
       *
       * Decoding may fail with a parse error.
       *
       * **Example** (Decode an HTTP payload)
       *
       * \`\`\`ts
       * const user = decodeUser(payload)
       * \`\`\`
       *
       * @deprecated Use decodeAccount for account payloads.
       * @see {@link decodeAccount}
       * @category decoding
       * @since 1.2.3
       */
      export const decodeUser = (input: unknown) => input;
    `,
    `
      /** @internal */
      export const internalValue = 1;
    `,
    "export default function main() {}",
    `
      /**
       * Returns a value in its original type.
       *
       * @category utilities
       * @since 1.0.0
       */
      export function identity(value: string): string;
      export function identity(value: number): number;
      export function identity(value: string | number): string | number { return value; }
    `,
  ],
  invalid: [
    {
      code: "export const userId = 'user-1';",
      errors: [missing],
    },
    {
      code: `
        /** A stable user identifier. */
        export type UserId = string;
      `,
      errors: [invalid, invalid],
    },
    {
      code: `
        /**
         * Decodes a user.
         *
         * **When to use**
         *
         * Helpful at an I/O boundary.
         *
         * @category decoding
         * @since 1.0.0
         */
        export const decodeUser = (input: unknown) => input;
      `,
      errors: [invalid],
    },
    {
      code: `
        /**
         * Decodes a user.
         *
         * **Gotchas**
         *
         * Decoding can fail.
         *
         * **Details**
         *
         * The input is untrusted.
         *
         * @category decoding
         * @since 1.0.0
         */
        export const decodeUser = (input: unknown) => input;
      `,
      errors: [invalid],
    },
    {
      code: `
        /**
         * Decodes a user.
         *
         * @since next
         * @param input The input.
         * @category decoding
         */
        export const decodeUser = (input: unknown) => input;
      `,
      errors: [invalid, invalid, invalid],
    },
    {
      code: `
        /**
         * Decodes a user.
         *
         * @example decodeUser(input)
         * @category decoding
         * @since 1.0.0
         */
        export const decodeUser = (input: unknown) => input;
      `,
      errors: [invalid],
    },
    {
      code: `
        /**
         * Decodes a user.
         *
         * **Example**
         *
         * \`\`\`ts
         * \`\`\`
         *
         * @category decoding
         * @since 1.0.0
         */
        export const decodeUser = (input: unknown) => input;
      `,
      errors: [invalid, invalid],
    },
    {
      code: `
        /**
         * Decodes a user.
         *
         * This second paragraph is not part of a standard section.
         *
         * @category decoding
         * @since 1.0.0
         */
        export const decodeUser = (input: unknown) => input;
      `,
      errors: [invalid, invalid],
    },
  ],
});
