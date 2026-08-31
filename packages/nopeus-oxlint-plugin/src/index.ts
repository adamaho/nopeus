import { eslintCompatPlugin } from "@oxlint/plugins";

import { noEffectRunnersInLibraryRule } from "./effect/rules/no-effect-runners-in-library.ts";
import { noFallibleEffectPromiseRule } from "./effect/rules/no-fallible-effect-promise.ts";
import { noInlineLiveLayerRule } from "./effect/rules/no-inline-live-layer.ts";
import { noUnscopedForkRule } from "./effect/rules/no-unscoped-fork.ts";
import { noUntypedEffectErrorsRule } from "./effect/rules/no-untyped-effect-errors.ts";
import { preferEffectCallbackRule } from "./effect/rules/prefer-effect-callback.ts";
import { preferEffectPlatformServicesRule } from "./effect/rules/prefer-effect-platform-services.ts";
import { preferEffectVoidRule } from "./effect/rules/prefer-effect-void.ts";
import { requireEffectFnNameRule } from "./effect/rules/require-effect-fn-name.ts";
import { requireServiceKeyPrefixRule } from "./effect/rules/require-service-key-prefix.ts";
import { requireServiceMakeLayerRule } from "./effect/rules/require-service-make-layer.ts";
import { noConditionalEmptyObjectSpreadRule } from "./rules/no-conditional-empty-object-spread.ts";
import { noKnownValueWideningRule } from "./rules/no-known-value-widening.ts";
import { noModuleMockingRule } from "./rules/no-module-mocking.ts";
import { noObjectParametersRule } from "./rules/no-object-parameters.ts";
import { noReflectApplyRule } from "./rules/no-reflect-apply.ts";
import { noReflectGetRule } from "./rules/no-reflect-get.ts";
import { noRuntimeTypeofRule } from "./rules/no-runtime-typeof.ts";
import { noTypeAssertionsRule } from "./rules/no-type-assertions.ts";
import { noUnknownReturnsRule } from "./rules/no-unknown-returns.ts";
import { noUnknownTypeAliasesRule } from "./rules/no-unknown-type-aliases.ts";
import { noUnsafeDictionaryTypeRule } from "./rules/no-unsafe-dictionary-type.ts";
import { requirePublicJSDocRule } from "./rules/require-public-jsdoc.ts";

/** Strict Oxlint rules for preserving type evidence and explicit Effect architecture. */
const nopeusPlugin = eslintCompatPlugin({
  meta: { name: "nopeus" },
  rules: {
    "no-effect-runners-in-library": noEffectRunnersInLibraryRule,
    "no-fallible-effect-promise": noFallibleEffectPromiseRule,
    "no-inline-live-layer": noInlineLiveLayerRule,
    "no-unscoped-fork": noUnscopedForkRule,
    "no-untyped-effect-errors": noUntypedEffectErrorsRule,
    "no-conditional-empty-object-spread": noConditionalEmptyObjectSpreadRule,
    "no-known-value-widening": noKnownValueWideningRule,
    "no-module-mocking": noModuleMockingRule,
    "no-object-parameters": noObjectParametersRule,
    "no-reflect-apply": noReflectApplyRule,
    "no-reflect-get": noReflectGetRule,
    "no-runtime-typeof": noRuntimeTypeofRule,
    "no-type-assertions": noTypeAssertionsRule,
    "no-unsafe-dictionary-type": noUnsafeDictionaryTypeRule,
    "no-unknown-returns": noUnknownReturnsRule,
    "no-unknown-type-aliases": noUnknownTypeAliasesRule,
    "prefer-effect-callback": preferEffectCallbackRule,
    "prefer-effect-platform-services": preferEffectPlatformServicesRule,
    "prefer-effect-void": preferEffectVoidRule,
    "require-public-jsdoc": requirePublicJSDocRule,
    "require-effect-fn-name": requireEffectFnNameRule,
    "require-service-key-prefix": requireServiceKeyPrefixRule,
    "require-service-make-layer": requireServiceMakeLayerRule,
  },
});

export default nopeusPlugin;
