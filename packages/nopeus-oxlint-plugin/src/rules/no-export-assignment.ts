import { defineRule } from "@oxlint/plugins";

/** Reject the TypeScript CommonJS export form not covered by import/no-commonjs. */
export const noExportAssignmentRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Require ESM exports instead of TypeScript export assignments." },
    schema: [],
    messages: { commonjs: "Use ESM export syntax instead of CommonJS export =." },
  },
  createOnce(context) {
    return {
      TSExportAssignment(node) {
        context.report({ node, messageId: "commonjs" });
      },
    };
  },
});
