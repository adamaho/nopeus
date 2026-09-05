# @nopeus/tool-tsconfig

Private workspace configurations that extend
[`@adamaho/nopeus-tsconfig`](../../packages/nopeus-tsconfig/README.md).
The published package owns compiler policy; this tool owns Node/Vite settings
and the local Effect compiler setup.

- `@nopeus/tool-tsconfig/base`: published base compiler policy.
- `@nopeus/tool-tsconfig/service`: base policy with NodeNext settings.
- `@nopeus/tool-tsconfig/app-vite`: base policy with Vite and React settings.
- `@nopeus/tool-tsconfig/effect`: published base and Effect compiler policy.

Add `@nopeus/tool-tsconfig` with `workspace:*` to a package's devDependencies.
For a Node package that uses Effect:

```json
{
  "extends": ["@nopeus/tool-tsconfig/service", "@nopeus/tool-tsconfig/effect"],
  "include": ["src/**/*.ts"]
}
```

The service and app-vite presets supply environment settings independently of
Effect. Effect projects add the Effect policy as shown above.

The workspace's preparation script runs `effect-tsgo patch`. Compiler tests
verify each canonical diagnostic through the inherited policy. The consumer
check packs the JSON package, installs it in an isolated project, and verifies
base-only compilation without Effect packages and Effect diagnostics after
installing and patching the compiler integration.

External projects install `@adamaho/nopeus-tsconfig`; their repository wrappers
retain their own environment settings and compiler preparation step. See the
[published package documentation](../../packages/nopeus-tsconfig/README.md).
