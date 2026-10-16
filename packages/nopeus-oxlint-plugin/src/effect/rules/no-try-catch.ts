import { defineRule } from "@oxlint/plugins";

/** Keep exception handling in Effect's typed error constructors and combinators. */
export const noTryCatchRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Use typed Effect error handling instead of try/catch." },
    messages: {
      useTypedErrorHandling:
        "Use Result.try for synchronous Result values, Effect.try for synchronous effects, or Effect.tryPromise for promises. Handle existing Effect failures with Effect.catch or Effect.catchTag instead of try/catch.",
    },
  },
  createOnce(context) {
    return {
      CatchClause(node) {
        context.report({ node, messageId: "useTypedErrorHandling" });
      },
    };
  },
});
