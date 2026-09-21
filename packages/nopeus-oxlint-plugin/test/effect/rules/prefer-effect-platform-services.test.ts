import { RuleTester } from "oxlint/plugins-dev";

import { preferEffectPlatformServicesRule } from "#src/effect/rules/prefer-effect-platform-services.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

const platformServiceError = { messageId: "platformService" } as const;
const errors = (count: number) => Array.from({ length: count }, () => platformServiceError);

tester.run("nopeus/prefer-effect-platform-services", preferEffectPlatformServicesRule, {
  valid: [
    'import { Clock, Console, Crypto, FileSystem, Path, Stdio } from "effect";',
    'import { readFile } from "./fs.ts";',
    'import type { Stats } from "node:fs";',
    'import { type ParsedPath } from "node:path";',
    'import type { ChildProcess } from "child_process";',
    'import type crypto from "node:crypto";',
    'import { type randomBytes, createCipheriv } from "crypto";',
    'import crypto from "node:crypto"; crypto.createCipheriv;',
    'import crypto from "node:crypto"; function use(crypto: { randomUUID(): string }) { return crypto.randomUUID(); }',
    'import { subtle } from "node:crypto"; subtle.encrypt;',
    'import { URL, URLSearchParams } from "node:url";',
    'import console, { Console } from "node:console"; console.profile("cpu"); new Console(process.stdout);',
    'import process, { env, exit } from "node:process"; process.memoryUsage(); env.NODE_ENV; exit;',
    'import { clearTimeout, setImmediate } from "node:timers";',
    'import { pipeline, Readable, Writable } from "node:stream";',
    'import { EventEmitter, once } from "node:events";',
    'import { Buffer, isUtf8 } from "node:buffer";',
    'import { cpus, homedir, tmpdir } from "node:os";',
    'import { PerformanceObserver } from "node:perf_hooks";',
    'import { inspect, parseArgs, promisify } from "node:util";',
    'import { connect } from "node:tls";',
    'import { Worker } from "node:worker_threads";',
    'import { isIP } from "node:net";',
    'import type { IncomingMessage } from "node:http";',
    `
      import { NodeHttpServer } from "@effect/platform-node";
      import { createServer } from "node:http";
      const layer = NodeHttpServer.layer(createServer, { port: 3000 });
    `,
    `
      import { layerConfig as nodeHttpLayerConfig } from "@effect/platform-node/NodeHttpServer";
      import { createServer as makeServer } from "http";
      const layer = nodeHttpLayerConfig(makeServer, { port: 3000 });
    `,
    `
      import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
      import https from "node:https";
      const layer = NodeHttpServer.layer(() => https.createServer(), { port: 3000 });
    `,
  ],
  invalid: [
    {
      code: 'import { readFile } from "node:fs/promises";',
      errors: errors(1),
    },
    {
      code: 'import fs from "fs";',
      errors: errors(1),
    },
    {
      code: 'import path from "node:path";',
      errors: errors(1),
    },
    {
      code: 'import * as path from "path";',
      errors: errors(1),
    },
    {
      code: 'import { spawn } from "node:child_process";',
      errors: errors(1),
    },
    {
      code: 'import childProcess from "child_process";',
      errors: errors(1),
    },
    {
      code: 'import { type Stats, readFile } from "node:fs";',
      errors: errors(1),
    },
    {
      code: 'import { randomUUID } from "node:crypto";',
      errors: errors(1),
    },
    {
      code: 'import { randomUUIDv7 } from "crypto";',
      errors: errors(1),
    },
    {
      code: 'import { randomBytes as bytes } from "node:crypto";',
      errors: errors(1),
    },
    {
      code: 'import { randomInt } from "crypto";',
      errors: errors(1),
    },
    {
      code: 'import { createHash } from "node:crypto";',
      errors: errors(1),
    },
    {
      code: 'import { hash } from "crypto";',
      errors: errors(1),
    },
    {
      code: 'import { subtle } from "node:crypto"; subtle.digest("SHA-256", new Uint8Array());',
      errors: errors(1),
    },
    {
      code: 'import { webcrypto as crypto } from "crypto"; crypto.subtle.digest("SHA-256", new Uint8Array());',
      errors: errors(1),
    },
    {
      code: 'import crypto from "node:crypto"; crypto.webcrypto.subtle.digest("SHA-256", new Uint8Array());',
      errors: errors(1),
    },
    {
      code: 'import * as crypto from "node:crypto"; crypto.randomUUID(); crypto.randomBytes(16);',
      errors: errors(2),
    },
    {
      code: 'import crypto from "crypto"; crypto.createHash("sha256");',
      errors: errors(1),
    },
    {
      code: 'import { default as crypto } from "node:crypto"; crypto["randomUUID"]();',
      errors: errors(1),
    },
    {
      code: 'import { fileURLToPath } from "node:url";',
      errors: errors(1),
    },
    {
      code: 'import { pathToFileURL as toUrl } from "url";',
      errors: errors(1),
    },
    {
      code: 'import * as url from "node:url"; url.fileURLToPath(import.meta.url);',
      errors: errors(1),
    },
    {
      code: 'import url from "url"; url.pathToFileURL("/tmp");',
      errors: errors(1),
    },
    {
      code: `
        import {
          assert, clear, count, countReset, debug, dir, dirxml, error, group,
          groupCollapsed, groupEnd, info, log, table, time, timeEnd, timeLog, trace, warn
        } from "node:console";
      `,
      errors: errors(19),
    },
    {
      code: 'import console from "console"; console.log("hello");',
      errors: errors(1),
    },
    {
      code: 'import { argv, stdin, stdout, stderr, hrtime } from "node:process";',
      errors: errors(5),
    },
    {
      code: 'import process from "process"; process.stdout.write("hello"); process.hrtime.bigint();',
      errors: errors(2),
    },
    {
      code: 'import { performance } from "node:perf_hooks"; performance.now();',
      errors: errors(1),
    },
    {
      code: 'import perfHooks from "perf_hooks"; perfHooks.performance.now();',
      errors: errors(1),
    },
    {
      code: 'import { setTimeout, setInterval } from "node:timers";',
      errors: errors(2),
    },
    {
      code: 'import { setTimeout, setInterval } from "timers/promises";',
      errors: errors(2),
    },
    {
      code: 'import timers from "timers"; timers.setTimeout(() => undefined, 10);',
      errors: errors(1),
    },
    {
      code: 'import { get, request } from "node:http";',
      errors: errors(2),
    },
    {
      code: 'import { get, request } from "https";',
      errors: errors(2),
    },
    {
      code: 'import http from "node:http"; http.get("http://localhost");',
      errors: errors(1),
    },
    {
      code: 'import { createServer } from "node:http"; createServer();',
      errors: errors(1),
    },
    {
      code: 'import https from "https"; https.createServer();',
      errors: errors(1),
    },
    {
      code: 'import { connect, createConnection, createServer } from "node:net";',
      errors: errors(3),
    },
    {
      code: 'import net from "net"; net.connect(3000); net.createServer();',
      errors: errors(2),
    },
  ],
});
